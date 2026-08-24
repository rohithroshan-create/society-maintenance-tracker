const prisma = require("../config/prisma");

const MS_PER_DAY = 24 * 60 * 60 * 1000;

/**
 * A complaint is overdue when it is not yet Resolved and has been
 * open longer than the configured threshold. This is computed on
 * read rather than stored, so changing the threshold instantly
 * reclassifies every complaint without a migration or batch job.
 */
function isOverdue(complaint, thresholdDays) {
  if (complaint.status === "Resolved") return false;
  const ageMs = Date.now() - new Date(complaint.createdAt).getTime();
  return ageMs > thresholdDays * MS_PER_DAY;
}

async function getOverdueThreshold() {
  const config = await prisma.config.findUnique({ where: { id: "singleton" } });
  return config?.overdueThresholdDays ?? Number(process.env.OVERDUE_THRESHOLD_DAYS || 5);
}

function decorateWithOverdue(complaint, thresholdDays) {
  return { ...complaint, overdue: isOverdue(complaint, thresholdDays) };
}

/**
 * Generates a human-friendly, sequential ticket number like SMT-0007.
 * Uses a count-based approach inside a transaction-safe retry to
 * avoid collisions under light concurrency typical of this app.
 */
async function generateTicketNo() {
  const count = await prisma.complaint.count();
  let n = count + 1;
  // Guard against rare collisions (e.g. a deleted complaint reused a number).
  for (let attempts = 0; attempts < 5; attempts++) {
    const candidate = `SMT-${String(n).padStart(4, "0")}`;
    const exists = await prisma.complaint.findUnique({ where: { ticketNo: candidate } });
    if (!exists) return candidate;
    n++;
  }
  return `SMT-${Date.now()}`;
}

module.exports = { isOverdue, getOverdueThreshold, decorateWithOverdue, generateTicketNo };

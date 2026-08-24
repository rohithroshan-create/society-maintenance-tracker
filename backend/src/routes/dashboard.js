const express = require("express");
const prisma = require("../config/prisma");
const { requireAuth, requireRole } = require("../middleware/auth");
const { getOverdueThreshold, isOverdue } = require("../utils/complaintHelpers");

const router = express.Router();

// GET /api/dashboard  (admin) — counts by status, by category, overdue count
router.get("/", requireAuth, requireRole("admin"), async (req, res) => {
  const [all, threshold] = await Promise.all([
    prisma.complaint.findMany({ select: { status: true, category: true, createdAt: true } }),
    getOverdueThreshold(),
  ]);

  const byStatus = {};
  const byCategory = {};
  let overdueCount = 0;

  for (const c of all) {
    byStatus[c.status] = (byStatus[c.status] || 0) + 1;
    byCategory[c.category] = (byCategory[c.category] || 0) + 1;
    if (isOverdue(c, threshold)) overdueCount++;
  }

  res.json({
    total: all.length,
    byStatus,
    byCategory,
    overdueCount,
    overdueThresholdDays: threshold,
  });
});

module.exports = router;

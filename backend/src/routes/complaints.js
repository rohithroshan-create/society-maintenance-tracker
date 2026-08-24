const express = require("express");
const prisma = require("../config/prisma");
const { requireAuth, requireRole } = require("../middleware/auth");
const upload = require("../middleware/upload");
const { getOverdueThreshold, decorateWithOverdue, generateTicketNo } = require("../utils/complaintHelpers");
const { sendMail, statusChangeEmail } = require("../utils/email");

const router = express.Router();

const CATEGORIES = ["Plumbing", "Electrical", "Housekeeping", "Security", "Lift", "Parking", "Common Area", "Other"];
const STATUSES = ["Open", "In Progress", "Resolved"];
const PRIORITIES = ["Low", "Medium", "High"];

// POST /api/complaints  (resident, multipart/form-data: category, description, photo?)
router.post("/", requireAuth, requireRole("resident"), upload.single("photo"), async (req, res) => {
  try {
    const { category, description } = req.body;
    if (!category || !description) {
      return res.status(400).json({ error: "Category and description are required." });
    }
    if (!CATEGORIES.includes(category)) {
      return res.status(400).json({ error: `Category must be one of: ${CATEGORIES.join(", ")}` });
    }

    const ticketNo = await generateTicketNo();
    const photoUrl = req.file ? `/uploads/${req.file.filename}` : null;

    const complaint = await prisma.complaint.create({
      data: {
        ticketNo,
        category,
        description,
        photoUrl,
        residentId: req.user.id,
        history: {
          create: {
            status: "Open",
            note: "Complaint raised by resident.",
            actorId: req.user.id,
            actorName: req.user.name,
            actorRole: req.user.role,
          },
        },
      },
      include: { history: true },
    });

    res.status(201).json({ complaint });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Could not submit your complaint. Please try again." });
  }
});

// GET /api/complaints/mine  (resident) — own complaints, newest first
router.get("/mine", requireAuth, requireRole("resident"), async (req, res) => {
  const threshold = await getOverdueThreshold();
  const complaints = await prisma.complaint.findMany({
    where: { residentId: req.user.id },
    orderBy: { createdAt: "desc" },
    include: { history: { orderBy: { createdAt: "asc" } } },
  });
  res.json({ complaints: complaints.map((c) => decorateWithOverdue(c, threshold)) });
});

// GET /api/complaints  (admin) — filter by category/status/date range, overdue-first sort
router.get("/", requireAuth, requireRole("admin"), async (req, res) => {
  const { category, status, from, to } = req.query;
  const threshold = await getOverdueThreshold();

  const where = {};
  if (category) where.category = category;
  if (status) where.status = status;
  if (from || to) {
    where.createdAt = {};
    if (from) where.createdAt.gte = new Date(from);
    if (to) where.createdAt.lte = new Date(to + "T23:59:59.999Z");
  }

  const complaints = await prisma.complaint.findMany({
    where,
    orderBy: { createdAt: "desc" },
    include: {
      resident: { select: { name: true, email: true, flatNumber: true } },
      history: { orderBy: { createdAt: "asc" } },
    },
  });

  const decorated = complaints.map((c) => decorateWithOverdue(c, threshold));
  // Overdue complaints surface at the top, as required by the brief.
  decorated.sort((a, b) => {
    if (a.overdue !== b.overdue) return a.overdue ? -1 : 1;
    return new Date(b.createdAt) - new Date(a.createdAt);
  });

  res.json({ complaints: decorated, overdueThresholdDays: threshold });
});

// GET /api/complaints/:id  (owner resident or admin)
router.get("/:id", requireAuth, async (req, res) => {
  const complaint = await prisma.complaint.findUnique({
    where: { id: req.params.id },
    include: {
      resident: { select: { name: true, email: true, flatNumber: true } },
      history: { orderBy: { createdAt: "asc" } },
    },
  });
  if (!complaint) return res.status(404).json({ error: "Complaint not found." });
  if (req.user.role !== "admin" && complaint.residentId !== req.user.id) {
    return res.status(403).json({ error: "You don't have permission to view this complaint." });
  }
  const threshold = await getOverdueThreshold();
  res.json({ complaint: decorateWithOverdue(complaint, threshold) });
});

// PATCH /api/complaints/:id/status  (admin) { status, note? }
router.patch("/:id/status", requireAuth, requireRole("admin"), async (req, res) => {
  try {
    const { status, note } = req.body;
    if (!STATUSES.includes(status)) {
      return res.status(400).json({ error: `Status must be one of: ${STATUSES.join(", ")}` });
    }

    const existing = await prisma.complaint.findUnique({
      where: { id: req.params.id },
      include: { resident: true },
    });
    if (!existing) return res.status(404).json({ error: "Complaint not found." });
    if (existing.status === "Resolved") {
      return res.status(400).json({ error: "This complaint is already closed and can't be updated further." });
    }

    const complaint = await prisma.complaint.update({
      where: { id: req.params.id },
      data: {
        status,
        resolvedAt: status === "Resolved" ? new Date() : null,
        history: {
          create: {
            status,
            note: note || null,
            actorId: req.user.id,
            actorName: req.user.name,
            actorRole: req.user.role,
          },
        },
      },
      include: { history: { orderBy: { createdAt: "asc" } }, resident: true },
    });

    // Email the resident — never let a mail failure block the response.
    const { subject, html } = statusChangeEmail({
      residentName: complaint.resident.name,
      ticketNo: complaint.ticketNo,
      category: complaint.category,
      status,
      note,
    });
    sendMail({ to: complaint.resident.email, subject, html }).catch(() => {});

    res.json({ complaint });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Could not update the complaint status." });
  }
});

// PATCH /api/complaints/:id/priority  (admin) { priority }
router.patch("/:id/priority", requireAuth, requireRole("admin"), async (req, res) => {
  const { priority } = req.body;
  if (!PRIORITIES.includes(priority)) {
    return res.status(400).json({ error: `Priority must be one of: ${PRIORITIES.join(", ")}` });
  }
  const existing = await prisma.complaint.findUnique({ where: { id: req.params.id } });
  if (!existing) return res.status(404).json({ error: "Complaint not found." });

  const complaint = await prisma.complaint.update({
    where: { id: req.params.id },
    data: { priority },
    include: { history: { orderBy: { createdAt: "asc" } } },
  });
  res.json({ complaint });
});

router.get("/meta/categories", requireAuth, (req, res) => {
  res.json({ categories: CATEGORIES, statuses: STATUSES, priorities: PRIORITIES });
});

module.exports = router;

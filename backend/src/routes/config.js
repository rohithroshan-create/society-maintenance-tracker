const express = require("express");
const prisma = require("../config/prisma");
const { requireAuth, requireRole } = require("../middleware/auth");

const router = express.Router();

// GET /api/config  (admin) — current overdue threshold
router.get("/", requireAuth, requireRole("admin"), async (req, res) => {
  const config = await prisma.config.upsert({
    where: { id: "singleton" },
    update: {},
    create: { id: "singleton", overdueThresholdDays: Number(process.env.OVERDUE_THRESHOLD_DAYS || 5) },
  });
  res.json({ config });
});

// PUT /api/config  (admin) { overdueThresholdDays }
router.put("/", requireAuth, requireRole("admin"), async (req, res) => {
  const { overdueThresholdDays } = req.body;
  const days = Number(overdueThresholdDays);
  if (!Number.isInteger(days) || days < 1) {
    return res.status(400).json({ error: "Overdue threshold must be a whole number of at least 1 day." });
  }
  const config = await prisma.config.upsert({
    where: { id: "singleton" },
    update: { overdueThresholdDays: days },
    create: { id: "singleton", overdueThresholdDays: days },
  });
  res.json({ config });
});

module.exports = router;

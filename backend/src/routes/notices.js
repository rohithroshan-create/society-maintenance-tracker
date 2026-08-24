const express = require("express");
const prisma = require("../config/prisma");
const { requireAuth, requireRole } = require("../middleware/auth");
const { sendMail, noticeEmail } = require("../utils/email");

const router = express.Router();

// GET /api/notices — everyone signed in, pinned/important notices first
router.get("/", requireAuth, async (req, res) => {
  const notices = await prisma.notice.findMany({
    orderBy: [{ important: "desc" }, { createdAt: "desc" }],
    include: { author: { select: { name: true } } },
  });
  res.json({ notices });
});

// POST /api/notices  (admin) { title, body, important? }
router.post("/", requireAuth, requireRole("admin"), async (req, res) => {
  try {
    const { title, body, important } = req.body;
    if (!title || !body) {
      return res.status(400).json({ error: "Title and body are required." });
    }

    const notice = await prisma.notice.create({
      data: { title, body, important: !!important, authorId: req.user.id },
      include: { author: { select: { name: true } } },
    });

    if (notice.important) {
      const residents = await prisma.user.findMany({ where: { role: "resident" } });
      const { subject, html } = noticeEmail({ residentName: "Resident", title, body });
      // Fire-and-forget per resident; failures are logged, not fatal.
      residents.forEach((r) => {
        const personalized = noticeEmail({ residentName: r.name, title, body });
        sendMail({ to: r.email, subject: personalized.subject, html: personalized.html }).catch(() => {});
      });
    }

    res.status(201).json({ notice });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Could not post the notice." });
  }
});

module.exports = router;

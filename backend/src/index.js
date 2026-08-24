require("dotenv").config();
const express = require("express");
const cors = require("cors");
const path = require("path");

const authRoutes = require("./routes/auth");
const complaintRoutes = require("./routes/complaints");
const noticeRoutes = require("./routes/notices");
const dashboardRoutes = require("./routes/dashboard");
const configRoutes = require("./routes/config");

const app = express();

app.use(cors({ origin: process.env.CLIENT_URL || "*" }));
app.use(express.json());
app.use("/uploads", express.static(path.join(__dirname, "..", "uploads")));

app.get("/api/health", (req, res) => res.json({ status: "ok", time: new Date().toISOString() }));

app.use("/api/auth", authRoutes);
app.use("/api/complaints", complaintRoutes);
app.use("/api/notices", noticeRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/config", configRoutes);

// Multer / generic error handler
app.use((err, req, res, next) => {
  if (err) {
    console.error(err);
    return res.status(err.status || 400).json({ error: err.message || "Something went wrong." });
  }
  next();
});

app.use((req, res) => res.status(404).json({ error: "Not found." }));

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`Society Maintenance Tracker API running on http://localhost:${PORT}`);
});

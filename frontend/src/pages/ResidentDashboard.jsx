import { useEffect, useState } from "react";
import { api } from "../api/client";
import { useToast } from "../context/ToastContext";
import ComplaintRow from "../components/ComplaintRow";

const CATEGORIES = ["Plumbing", "Electrical", "Housekeeping", "Security", "Lift", "Parking", "Common Area", "Other"];

export default function ResidentDashboard() {
  const { push } = useToast();
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ category: CATEGORIES[0], description: "" });
  const [photo, setPhoto] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [filter, setFilter] = useState("all");

  async function load() {
    setLoading(true);
    try {
      const { complaints } = await api.get("/api/complaints/mine");
      setComplaints(complaints);
    } catch (err) {
      push(err.message, "error");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.description.trim()) return;
    setSubmitting(true);
    try {
      const body = new FormData();
      body.append("category", form.category);
      body.append("description", form.description);
      if (photo) body.append("photo", photo);
      await api.post("/api/complaints", body, { isForm: true });
      push(`Complaint raised. You'll be notified as it progresses.`);
      setForm({ category: CATEGORIES[0], description: "" });
      setPhoto(null);
      document.getElementById("photo-input").value = "";
      load();
    } catch (err) {
      push(err.message, "error");
    } finally {
      setSubmitting(false);
    }
  }

  const filtered = complaints.filter((c) => {
    if (filter === "all") return true;
    if (filter === "open") return c.status !== "Resolved";
    return c.status === "Resolved";
  });

  return (
    <div className="max-w-6xl mx-auto px-5 py-8 grid gap-8 lg:grid-cols-[360px,1fr]">
      <div>
        <h1 className="font-display text-2xl font-semibold text-ink mb-1">Raise a complaint</h1>
        <p className="text-sm font-body text-inkfaint mb-4">
          Every entry is logged with a ticket number and tracked until it's resolved.
        </p>
        <form onSubmit={handleSubmit} className="bg-card border border-line rounded-md p-5 shadow-pin space-y-4">
          <div>
            <label className="text-xs font-body font-semibold uppercase tracking-wide text-inkfaint">Category</label>
            <select
              value={form.category}
              onChange={(e) => setForm({ ...form, category: e.target.value })}
              className="mt-1 w-full rounded-sm border border-line bg-card px-3 py-2 text-sm font-body"
            >
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-xs font-body font-semibold uppercase tracking-wide text-inkfaint">
              What's the issue?
            </label>
            <textarea
              required
              rows={4}
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="Describe what's wrong and where — the more detail, the faster it gets sorted."
              className="mt-1 w-full rounded-sm border border-line bg-card px-3 py-2 text-sm font-body"
            />
          </div>
          <div>
            <label className="text-xs font-body font-semibold uppercase tracking-wide text-inkfaint">
              Photo (optional)
            </label>
            <input
              id="photo-input"
              type="file"
              accept="image/png,image/jpeg,image/webp,image/gif"
              onChange={(e) => setPhoto(e.target.files[0] || null)}
              className="mt-1 w-full text-sm font-body file:mr-3 file:rounded-sm file:border-0 file:bg-brand-light file:text-brand-dark file:px-3 file:py-1.5 file:font-semibold"
            />
          </div>
          <button
            type="submit"
            disabled={submitting}
            className="w-full rounded-sm bg-brand text-paper font-body font-semibold py-2.5 hover:bg-brand-dark transition-colors disabled:opacity-50"
          >
            {submitting ? "Submitting…" : "Submit complaint"}
          </button>
        </form>
      </div>

      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-display text-2xl font-semibold text-ink">My complaints</h2>
          <div className="flex gap-1 bg-line/40 rounded-md p-1">
            {[
              { key: "all", label: "All" },
              { key: "open", label: "Open" },
              { key: "resolved", label: "Resolved" },
            ].map((f) => (
              <button
                key={f.key}
                onClick={() => setFilter(f.key)}
                className={`px-3 py-1 text-xs font-body font-semibold rounded-sm transition-colors ${
                  filter === f.key ? "bg-card text-brand-dark shadow-sm" : "text-inkfaint"
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <p className="text-sm font-mono text-inkfaint">Loading your entries…</p>
        ) : filtered.length === 0 ? (
          <div className="border border-dashed border-line rounded-md p-10 text-center">
            <p className="font-display text-lg text-ink">Nothing here yet</p>
            <p className="text-sm font-body text-inkfaint mt-1">
              Raise your first complaint using the form on the left — it'll show up here with a ticket number.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map((c) => (
              <ComplaintRow key={c.id} complaint={c} isAdmin={false} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

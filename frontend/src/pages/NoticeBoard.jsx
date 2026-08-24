import { useEffect, useState } from "react";
import { api } from "../api/client";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";

function formatDate(d) {
  return new Date(d).toLocaleDateString(undefined, { day: "2-digit", month: "short", year: "numeric" });
}

const ROTATE = ["-rotate-1", "rotate-1", "-rotate-2", "rotate-2", "rotate-0"];

export default function NoticeBoard() {
  const { user } = useAuth();
  const { push } = useToast();
  const [notices, setNotices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ title: "", body: "", important: false });
  const [submitting, setSubmitting] = useState(false);

  async function load() {
    setLoading(true);
    try {
      const { notices } = await api.get("/api/notices");
      setNotices(notices);
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
    if (!form.title.trim() || !form.body.trim()) return;
    setSubmitting(true);
    try {
      await api.post("/api/notices", form);
      push(form.important ? "Notice posted and emailed to all residents." : "Notice posted to the board.");
      setForm({ title: "", body: "", important: false });
      load();
    } catch (err) {
      push(err.message, "error");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="max-w-6xl mx-auto px-5 py-8">
      <h1 className="font-display text-2xl font-semibold text-ink mb-1">Notice board</h1>
      <p className="text-sm font-body text-inkfaint mb-6">Important notices are pinned to the top and emailed to every resident.</p>

      {user.role === "admin" && (
        <form onSubmit={handleSubmit} className="bg-card border border-line rounded-md p-5 mb-8 space-y-3 max-w-xl">
          <h2 className="font-display text-lg font-semibold text-ink">Post a notice</h2>
          <input
            required
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            placeholder="Title, e.g. Water supply shutdown on Sunday"
            className="w-full rounded-sm border border-line bg-card px-3 py-2 text-sm font-body"
          />
          <textarea
            required
            rows={3}
            value={form.body}
            onChange={(e) => setForm({ ...form, body: e.target.value })}
            placeholder="Details residents need to know"
            className="w-full rounded-sm border border-line bg-card px-3 py-2 text-sm font-body"
          />
          <label className="flex items-center gap-2 text-sm font-body text-ink">
            <input
              type="checkbox"
              checked={form.important}
              onChange={(e) => setForm({ ...form, important: e.target.checked })}
              className="rounded-sm border-line"
            />
            Mark as important — pins to the top and emails every resident
          </label>
          <button
            type="submit"
            disabled={submitting}
            className="rounded-sm bg-brand text-paper text-sm font-body font-semibold px-4 py-2 hover:bg-brand-dark transition-colors disabled:opacity-50"
          >
            {submitting ? "Posting…" : "Post notice"}
          </button>
        </form>
      )}

      {loading ? (
        <p className="text-sm font-mono text-inkfaint">Loading notices…</p>
      ) : notices.length === 0 ? (
        <div className="border border-dashed border-line rounded-md p-10 text-center max-w-xl">
          <p className="font-display text-lg text-ink">The board is empty</p>
          <p className="text-sm font-body text-inkfaint mt-1">Notices from the society office will appear here.</p>
        </div>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {notices.map((n, i) => (
            <div
              key={n.id}
              className={`relative bg-card border border-line rounded-sm p-5 shadow-pin ${
                n.important ? `pin-dot ${ROTATE[i % ROTATE.length]}` : ""
              }`}
            >
              {n.important && (
                <span className="absolute top-3 right-3 text-[10px] font-body font-semibold uppercase tracking-wide text-brick">
                  Pinned
                </span>
              )}
              <p className="font-display text-lg font-semibold text-ink pr-12">{n.title}</p>
              <p className="text-sm font-body text-ink/80 mt-2 whitespace-pre-wrap">{n.body}</p>
              <p className="font-mono text-[11px] text-inkfaint mt-4">
                {n.author?.name || "Society office"} · {formatDate(n.createdAt)}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

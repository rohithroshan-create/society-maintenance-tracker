import { useEffect, useState } from "react";
import { api } from "../api/client";
import { useToast } from "../context/ToastContext";
import StatCard from "../components/StatCard";

export default function AdminDashboard() {
  const { push } = useToast();
  const [stats, setStats] = useState(null);
  const [threshold, setThreshold] = useState("");
  const [savingThreshold, setSavingThreshold] = useState(false);

  async function load() {
    try {
      const data = await api.get("/api/dashboard");
      setStats(data);
      setThreshold(String(data.overdueThresholdDays));
    } catch (err) {
      push(err.message, "error");
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function saveThreshold(e) {
    e.preventDefault();
    setSavingThreshold(true);
    try {
      await api.put("/api/config", { overdueThresholdDays: Number(threshold) });
      push("Overdue threshold updated.");
      load();
    } catch (err) {
      push(err.message, "error");
    } finally {
      setSavingThreshold(false);
    }
  }

  if (!stats) {
    return <p className="max-w-6xl mx-auto px-5 py-8 text-sm font-mono text-inkfaint">Tallying the register…</p>;
  }

  const categoryEntries = Object.entries(stats.byCategory).sort((a, b) => b[1] - a[1]);
  const maxCategory = Math.max(1, ...categoryEntries.map(([, n]) => n));

  return (
    <div className="max-w-6xl mx-auto px-5 py-8">
      <h1 className="font-display text-2xl font-semibold text-ink mb-1">Society dashboard</h1>
      <p className="text-sm font-body text-inkfaint mb-6">A running tally of the register, updated live.</p>

      <div className="grid gap-4 sm:grid-cols-4 mb-8">
        <StatCard label="Total complaints" value={stats.total} />
        <StatCard label="Open" value={stats.byStatus.Open || 0} tone="brick" />
        <StatCard label="In progress" value={stats.byStatus["In Progress"] || 0} tone="amber" />
        <StatCard label="Resolved" value={stats.byStatus.Resolved || 0} tone="leaf" />
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.4fr,1fr]">
        <div className="bg-card border border-line rounded-md p-5">
          <h2 className="font-display text-lg font-semibold text-ink mb-4">By category</h2>
          <div className="space-y-3">
            {categoryEntries.length === 0 && (
              <p className="text-sm font-body text-inkfaint">No complaints logged yet.</p>
            )}
            {categoryEntries.map(([cat, n]) => (
              <div key={cat}>
                <div className="flex justify-between text-sm font-body mb-1">
                  <span className="text-ink">{cat}</span>
                  <span className="font-mono text-inkfaint">{n}</span>
                </div>
                <div className="h-2 rounded-full bg-line/60 overflow-hidden">
                  <div
                    className="h-full bg-brand rounded-full"
                    style={{ width: `${(n / maxCategory) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-brick-light border border-brick/30 rounded-md p-5">
            <p className="text-[11px] font-body font-semibold uppercase tracking-wide text-brick">Overdue</p>
            <p className="font-mono text-4xl font-semibold text-brick mt-1">{stats.overdueCount}</p>
            <p className="text-sm font-body text-brick/80 mt-1">
              Open past {stats.overdueThresholdDays} day{stats.overdueThresholdDays === 1 ? "" : "s"} without resolution.
            </p>
          </div>

          <form onSubmit={saveThreshold} className="bg-card border border-line rounded-md p-5">
            <h2 className="font-display text-lg font-semibold text-ink mb-1">Overdue threshold</h2>
            <p className="text-sm font-body text-inkfaint mb-3">
              Complaints open longer than this are flagged overdue across the register.
            </p>
            <div className="flex items-center gap-2">
              <input
                type="number"
                min={1}
                value={threshold}
                onChange={(e) => setThreshold(e.target.value)}
                className="w-20 rounded-sm border border-line bg-card px-2 py-1.5 text-sm font-body font-mono"
              />
              <span className="text-sm font-body text-inkfaint">days</span>
              <button
                type="submit"
                disabled={savingThreshold}
                className="ml-auto rounded-sm bg-brand text-paper text-sm font-body font-semibold px-4 py-1.5 hover:bg-brand-dark transition-colors disabled:opacity-50"
              >
                Save
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

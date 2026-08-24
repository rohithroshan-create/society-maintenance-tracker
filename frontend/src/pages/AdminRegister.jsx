import { useEffect, useState } from "react";
import { api } from "../api/client";
import { useToast } from "../context/ToastContext";
import ComplaintRow from "../components/ComplaintRow";

const CATEGORIES = ["Plumbing", "Electrical", "Housekeeping", "Security", "Lift", "Parking", "Common Area", "Other"];
const STATUSES = ["Open", "In Progress", "Resolved"];

export default function AdminRegister() {
  const { push } = useToast();
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ category: "", status: "", from: "", to: "" });
  const [overdueOnly, setOverdueOnly] = useState(false);
  const [threshold, setThreshold] = useState(null);

  async function load() {
    setLoading(true);
    try {
      const { complaints, overdueThresholdDays } = await api.get("/api/complaints", filters);
      setComplaints(complaints);
      setThreshold(overdueThresholdDays);
    } catch (err) {
      push(err.message, "error");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters]);

  async function handleUpdateStatus(id, status, note) {
    try {
      await api.patch(`/api/complaints/${id}/status`, { status, note });
      push(`Status updated to "${status}". Resident notified by email.`);
      load();
    } catch (err) {
      push(err.message, "error");
    }
  }

  async function handleUpdatePriority(id, priority) {
    try {
      await api.patch(`/api/complaints/${id}/priority`, { priority });
      push(`Priority set to ${priority}.`);
      load();
    } catch (err) {
      push(err.message, "error");
    }
  }

  const visible = overdueOnly ? complaints.filter((c) => c.overdue) : complaints;

  return (
    <div className="max-w-6xl mx-auto px-5 py-8">
      <div className="flex flex-wrap items-end justify-between gap-4 mb-6">
        <div>
          <h1 className="font-display text-2xl font-semibold text-ink">Complaint register</h1>
          <p className="text-sm font-body text-inkfaint mt-1">
            {threshold !== null && `Complaints open past ${threshold} day${threshold === 1 ? "" : "s"} are flagged overdue and pinned to the top.`}
          </p>
        </div>
        <button
          onClick={() => setOverdueOnly((o) => !o)}
          className={`px-3 py-1.5 text-xs font-body font-semibold rounded-sm border transition-colors ${
            overdueOnly ? "bg-brick text-paper border-brick" : "border-line text-brick"
          }`}
        >
          ● Overdue only
        </button>
      </div>

      <div className="bg-card border border-line rounded-md p-4 mb-6 grid gap-3 sm:grid-cols-4">
        <div>
          <label className="text-[11px] font-body font-semibold uppercase tracking-wide text-inkfaint">Category</label>
          <select
            value={filters.category}
            onChange={(e) => setFilters({ ...filters, category: e.target.value })}
            className="mt-1 w-full rounded-sm border border-line bg-card px-2 py-1.5 text-sm font-body"
          >
            <option value="">All categories</option>
            {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
        <div>
          <label className="text-[11px] font-body font-semibold uppercase tracking-wide text-inkfaint">Status</label>
          <select
            value={filters.status}
            onChange={(e) => setFilters({ ...filters, status: e.target.value })}
            className="mt-1 w-full rounded-sm border border-line bg-card px-2 py-1.5 text-sm font-body"
          >
            <option value="">All statuses</option>
            {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
        <div>
          <label className="text-[11px] font-body font-semibold uppercase tracking-wide text-inkfaint">From</label>
          <input
            type="date"
            value={filters.from}
            onChange={(e) => setFilters({ ...filters, from: e.target.value })}
            className="mt-1 w-full rounded-sm border border-line bg-card px-2 py-1.5 text-sm font-body"
          />
        </div>
        <div>
          <label className="text-[11px] font-body font-semibold uppercase tracking-wide text-inkfaint">To</label>
          <input
            type="date"
            value={filters.to}
            onChange={(e) => setFilters({ ...filters, to: e.target.value })}
            className="mt-1 w-full rounded-sm border border-line bg-card px-2 py-1.5 text-sm font-body"
          />
        </div>
      </div>

      {loading ? (
        <p className="text-sm font-mono text-inkfaint">Loading the register…</p>
      ) : visible.length === 0 ? (
        <div className="border border-dashed border-line rounded-md p-10 text-center">
          <p className="font-display text-lg text-ink">No complaints match these filters</p>
          <p className="text-sm font-body text-inkfaint mt-1">Try widening the date range or clearing a filter.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {visible.map((c) => (
            <ComplaintRow
              key={c.id}
              complaint={c}
              isAdmin
              onUpdateStatus={handleUpdateStatus}
              onUpdatePriority={handleUpdatePriority}
            />
          ))}
        </div>
      )}
    </div>
  );
}

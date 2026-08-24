import { useState } from "react";
import StatusStamp from "./StatusStamp";
import PriorityTag from "./PriorityTag";
import HistoryTimeline from "./HistoryTimeline";
import { fileUrl } from "../api/client";

const STATUS_OPTIONS = ["Open", "In Progress", "Resolved"];
const PRIORITY_OPTIONS = ["Low", "Medium", "High"];

function formatDate(d) {
  return new Date(d).toLocaleDateString(undefined, { day: "2-digit", month: "short", year: "numeric" });
}

export default function ComplaintRow({ complaint, isAdmin, onUpdateStatus, onUpdatePriority }) {
  const [open, setOpen] = useState(false);
  const [note, setNote] = useState("");
  const [nextStatus, setNextStatus] = useState(complaint.status);
  const [saving, setSaving] = useState(false);

  const rowRuleColor = complaint.overdue
    ? "#A63D2F"
    : complaint.status === "Resolved"
    ? "#3E7C4A"
    : "#D8D0BF";

  async function handleStatusSave(e) {
    e.preventDefault();
    if (nextStatus === complaint.status) return;
    setSaving(true);
    try {
      await onUpdateStatus(complaint.id, nextStatus, note);
      setNote("");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div
      className="ledger-row bg-card border border-line rounded-md pl-5 pr-4 py-4 shadow-sm"
      style={{ "--rule-color": rowRuleColor }}
    >
      <button
        className="w-full flex flex-wrap items-start justify-between gap-3 text-left"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
      >
        <div className="flex-1 min-w-[220px]">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-mono text-xs text-inkfaint">{complaint.ticketNo}</span>
            {complaint.overdue && (
              <span className="text-[11px] font-body font-semibold uppercase tracking-wide text-brick">
                ● Overdue
              </span>
            )}
            {isAdmin && complaint.resident && (
              <span className="text-[11px] font-body text-inkfaint">
                {complaint.resident.name} · {complaint.resident.flatNumber || "—"}
              </span>
            )}
          </div>
          <p className="font-display text-base font-semibold text-ink mt-0.5">{complaint.category}</p>
          <p className="font-body text-sm text-ink/80 mt-0.5 line-clamp-2">{complaint.description}</p>
          <p className="font-mono text-[11px] text-inkfaint mt-1">Raised {formatDate(complaint.createdAt)}</p>
        </div>

        <div className="flex items-center gap-2">
          <PriorityTag priority={complaint.priority} />
          <StatusStamp status={complaint.status} />
          <span className="text-inkfaint text-lg leading-none select-none">{open ? "−" : "+"}</span>
        </div>
      </button>

      {open && (
        <div className="mt-4 pt-4 border-t border-dashed border-line grid gap-5 sm:grid-cols-[1fr,1.2fr]">
          <div>
            {complaint.photoUrl && (
              <a href={fileUrl(complaint.photoUrl)} target="_blank" rel="noreferrer">
                <img
                  src={fileUrl(complaint.photoUrl)}
                  alt={`Photo attached to complaint ${complaint.ticketNo}`}
                  className="rounded-md border border-line max-h-48 object-cover mb-3"
                />
              </a>
            )}
            <p className="font-body text-sm text-ink/90 whitespace-pre-wrap">{complaint.description}</p>

            {isAdmin && (
              <div className="mt-4 space-y-3 bg-paper/60 border border-line rounded-md p-3">
                <div>
                  <label className="text-[11px] font-body font-semibold uppercase tracking-wide text-inkfaint">
                    Priority
                  </label>
                  <select
                    value={complaint.priority}
                    onChange={(e) => onUpdatePriority(complaint.id, e.target.value)}
                    className="mt-1 w-full rounded-sm border border-line bg-card px-2 py-1.5 text-sm font-body"
                  >
                    {PRIORITY_OPTIONS.map((p) => (
                      <option key={p} value={p}>{p}</option>
                    ))}
                  </select>
                </div>

                {complaint.status !== "Resolved" ? (
                  <form onSubmit={handleStatusSave} className="space-y-2">
                    <div>
                      <label className="text-[11px] font-body font-semibold uppercase tracking-wide text-inkfaint">
                        Move to status
                      </label>
                      <select
                        value={nextStatus}
                        onChange={(e) => setNextStatus(e.target.value)}
                        className="mt-1 w-full rounded-sm border border-line bg-card px-2 py-1.5 text-sm font-body"
                      >
                        {STATUS_OPTIONS.map((s) => (
                          <option key={s} value={s}>{s}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="text-[11px] font-body font-semibold uppercase tracking-wide text-inkfaint">
                        Note (optional)
                      </label>
                      <textarea
                        value={note}
                        onChange={(e) => setNote(e.target.value)}
                        rows={2}
                        placeholder="e.g. Plumber assigned, visiting tomorrow morning"
                        className="mt-1 w-full rounded-sm border border-line bg-card px-2 py-1.5 text-sm font-body"
                      />
                    </div>
                    <button
                      type="submit"
                      disabled={saving || nextStatus === complaint.status}
                      className="w-full rounded-sm bg-brand text-paper text-sm font-body font-semibold py-1.5 hover:bg-brand-dark transition-colors disabled:opacity-40"
                    >
                      {saving ? "Saving…" : "Update status"}
                    </button>
                  </form>
                ) : (
                  <p className="text-xs font-body text-leaf font-semibold">
                    Closed — resolved complaints can't be edited further.
                  </p>
                )}
              </div>
            )}
          </div>

          <div>
            <p className="text-[11px] font-body font-semibold uppercase tracking-wide text-inkfaint mb-2">
              Status history
            </p>
            <HistoryTimeline history={complaint.history} />
          </div>
        </div>
      )}
    </div>
  );
}

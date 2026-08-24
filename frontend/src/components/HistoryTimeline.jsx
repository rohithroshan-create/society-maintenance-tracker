function formatDate(d) {
  return new Date(d).toLocaleString(undefined, {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

const DOT_COLOR = {
  Open: "bg-brick",
  "In Progress": "bg-amber",
  Resolved: "bg-leaf",
};

export default function HistoryTimeline({ history }) {
  return (
    <ol className="relative border-l border-line ml-2 pl-5 space-y-4">
      {history.map((h) => (
        <li key={h.id} className="relative">
          <span
            className={`absolute -left-[26px] top-1 w-3 h-3 rounded-full ring-4 ring-card ${DOT_COLOR[h.status] || "bg-inkfaint"}`}
          />
          <p className="font-body text-sm text-ink">
            <span className="font-semibold">{h.status}</span>
            <span className="text-inkfaint"> · by {h.actorName} ({h.actorRole})</span>
          </p>
          <p className="font-mono text-[11px] text-inkfaint">{formatDate(h.createdAt)}</p>
          {h.note && <p className="text-sm text-ink/80 mt-0.5 italic">"{h.note}"</p>}
        </li>
      ))}
    </ol>
  );
}

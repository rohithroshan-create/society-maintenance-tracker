const STYLES = {
  Low: "bg-brand-light text-brand-dark",
  Medium: "bg-amber-light text-amber",
  High: "bg-brick-light text-brick",
};

export default function PriorityTag({ priority }) {
  return (
    <span
      className={`inline-flex items-center rounded-sm px-2 py-0.5 text-[11px] font-body font-semibold uppercase tracking-wide ${STYLES[priority] || "bg-line text-inkfaint"}`}
    >
      {priority} priority
    </span>
  );
}

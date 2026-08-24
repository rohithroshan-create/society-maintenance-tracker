const STYLES = {
  Open: "text-brick",
  "In Progress": "text-amber",
  Resolved: "text-leaf",
};

const ROTATE = {
  Open: "-rotate-3",
  "In Progress": "rotate-2",
  Resolved: "-rotate-2",
};

/**
 * The signature element of the app: a stamped, slightly-rotated ink-stamp
 * badge for complaint status, echoing the way a society register book
 * gets physically stamped "RESOLVED" or "PENDING" by the office.
 */
export default function StatusStamp({ status, size = "md" }) {
  const sizeClasses = size === "sm" ? "text-[10px] px-2 py-0.5" : "text-xs px-3 py-1";
  return (
    <span
      className={`stamp inline-flex items-center justify-center font-display font-semibold uppercase tracking-wider ${sizeClasses} ${STYLES[status] || "text-inkfaint"} ${ROTATE[status] || ""}`}
    >
      {status}
    </span>
  );
}

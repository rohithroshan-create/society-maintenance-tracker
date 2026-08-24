export default function StatCard({ label, value, tone = "brand" }) {
  const toneClasses = {
    brand: "text-brand-dark",
    brick: "text-brick",
    amber: "text-amber",
    leaf: "text-leaf",
  };
  return (
    <div className="bg-card border border-line rounded-md p-4">
      <p className="text-[11px] font-body font-semibold uppercase tracking-wide text-inkfaint">{label}</p>
      <p className={`font-mono text-3xl font-semibold mt-1 ${toneClasses[tone]}`}>{value}</p>
    </div>
  );
}

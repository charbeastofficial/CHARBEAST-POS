// No more Preparing/Ready kitchen-progress tracking. The label is driven by
// isPaid rather than trusting status alone to say "Completed" -- that way a
// paid order always reads as Completed even if some write path only ever
// flips is_paid without touching status (or an older row predates that fix).
const STATUS_STYLES = {
  Pending: "bg-brand-red/15 text-brand-red",
  Active: "bg-brand-yellow/15 text-brand-yellow",
  Completed: "bg-brand-teal-deep/20 text-brand-teal",
  Cancelled: "bg-brand-red-deep/20 text-brand-red",
};

function displayStatus(status, isPaid) {
  if (status === "Cancelled") return "Cancelled";
  if (isPaid) return "Completed";
  if (status === "Pending") return "Pending";
  return "Active";
}

export default function StatusPill({ status, isPaid, className = "" }) {
  const label = displayStatus(status, isPaid);
  return (
    <span className={`rounded px-2 py-0.5 text-[11px] font-bold uppercase ${STATUS_STYLES[label] || "bg-cream/10 text-text-muted"} ${className}`}>
      {label}
    </span>
  );
}

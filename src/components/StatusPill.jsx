const STATUS_STYLES = {
  Pending: "bg-brand-red/15 text-brand-red",
  Preparing: "bg-brand-yellow/15 text-brand-yellow",
  Ready: "bg-brand-teal/15 text-brand-teal",
  Completed: "bg-brand-teal-deep/20 text-brand-teal",
  Cancelled: "bg-brand-red-deep/20 text-brand-red",
};

export default function StatusPill({ status, className = "" }) {
  return (
    <span className={`rounded px-2 py-0.5 text-[11px] font-bold uppercase ${STATUS_STYLES[status] || "bg-cream/10 text-text-muted"} ${className}`}>
      {status}
    </span>
  );
}

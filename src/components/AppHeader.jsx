import Logo from "./Logo";

export default function AppHeader({ time, contactPhone, contactAddress }) {
  return (
    <header className="flex h-14 shrink-0 items-center gap-3 border-b border-cream/10 bg-surface-elevated px-4">
      <Logo size="sm" />
      <div className="flex items-center gap-4 shrink-0 border-l border-cream/10 pl-3">
        <p className="text-[10px] text-text-muted leading-tight">{time}</p>
        {contactPhone && (
          <span className="hidden text-[10px] text-text-muted leading-tight lg:inline">{contactPhone}</span>
        )}
        {contactAddress && (
          <span className="hidden text-[10px] text-text-muted leading-tight xl:inline">{contactAddress}</span>
        )}
      </div>
    </header>
  );
}
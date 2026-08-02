export default function Sidebar({
  view,
  onChangeView,
  queueCount,
  unpaidCount,
  printerConnected,
  onConnectPrinter,
  soundEnabled,
  onToggleSound,
  userLabel,
  onLogout,
  hasUnsavedTicket,
}) {
  const handleLogoutClick = () => {
    if (hasUnsavedTicket && !window.confirm("You have an unsent order with items on it. Log out anyway?")) {
      return;
    }
    onLogout();
  };

  return (
    <aside className="hidden w-16 flex-col items-center border-r border-cream/10 bg-surface-elevated py-3 lg:flex">
      <nav className="flex flex-col items-center gap-1">
        <NavButton icon="point_of_sale" label="POS" active={view === "register"} onClick={() => onChangeView("register")} />
        <NavButton
          icon="notifications"
          label="Queue"
          active={view === "queue"}
          badgeCount={queueCount}
          onClick={() => onChangeView("queue")}
        />
        <NavButton
          icon="receipt_long"
          label="Orders"
          active={view === "orders"}
          badgeCount={unpaidCount}
          onClick={() => onChangeView("orders")}
        />
      </nav>

      <div className="mt-auto flex flex-col items-center gap-1">
        <ToolButton
          icon="print"
          active={printerConnected}
          title={printerConnected ? "Printer connected — click to manage" : "Connect thermal printer"}
          onClick={onConnectPrinter}
        />
        <ToolButton
          icon={soundEnabled ? "volume_up" : "volume_off"}
          active={soundEnabled}
          title={soundEnabled ? "Mute notification sound" : "Unmute notification sound"}
          onClick={onToggleSound}
        />
        <ToolButton
          icon="logout"
          title={`Sign out (${userLabel})`}
          onClick={handleLogoutClick}
          className="hover:text-brand-red"
        />
      </div>
    </aside>
  );
}

function NavButton({ icon, label, active, badgeCount, onClick }) {
  return (
    <button
      title={label}
      onClick={onClick}
      className={`relative flex w-12 flex-col items-center gap-0.5 rounded-xl py-2 transition active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-orange ${
        active
          ? "bg-brand-orange text-white shadow-[0_4px_14px_rgba(255,87,34,0.35)]"
          : "text-text-muted hover:bg-cream/5 hover:text-cream"
      }`}
    >
      <span className="material-symbols-outlined text-xl">{icon}</span>
      <span className="text-[8px] font-bold leading-tight">{label}</span>
      {badgeCount > 0 && (
        <span className="absolute -top-0.5 -right-0.5 flex h-3.5 min-w-[14px] items-center justify-center rounded-full bg-brand-red px-0.5 text-[7px] font-bold text-white ring-2 ring-surface-elevated">
          {badgeCount > 9 ? "9+" : badgeCount}
        </span>
      )}
    </button>
  );
}

function ToolButton({ icon, title, onClick, active, className = "" }) {
  return (
    <button
      title={title}
      onClick={onClick}
      className={`relative flex h-11 w-11 items-center justify-center rounded-xl text-text-muted transition hover:bg-cream/5 hover:text-cream focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-orange ${className}`}
    >
      <span className="material-symbols-outlined text-lg">{icon}</span>
      {active !== undefined && (
        <span
          className={`absolute top-1.5 right-1.5 h-1.5 w-1.5 rounded-full border border-surface-elevated ${
            active ? "bg-brand-teal" : "bg-text-dim"
          }`}
        />
      )}
    </button>
  );
}
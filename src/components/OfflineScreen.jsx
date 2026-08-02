export default function OfflineScreen() {
  return (
    <div className="fixed inset-0 z-[999] flex items-center justify-center bg-surface/95 backdrop-blur-sm">
      <div className="flex max-w-sm flex-col items-center gap-4 text-center">
        <span className="material-symbols-outlined text-6xl text-brand-red">wifi_off</span>
        <h1 className="text-xl font-bold text-cream">No Internet Connection</h1>
        <p className="text-sm text-text-muted">
          CharBeast POS needs an internet connection to load the menu and take orders.
          Check your network connection — this screen will clear automatically once it's back.
        </p>
        <div className="mt-2 flex items-center gap-2 text-xs text-text-dim">
          <span className="h-2 w-2 animate-pulse rounded-full bg-brand-red" />
          Retrying automatically…
        </div>
      </div>
    </div>
  );
}

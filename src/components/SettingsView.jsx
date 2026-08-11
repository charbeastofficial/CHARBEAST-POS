const FONT_SIZES = [
  { label: "Small", px: 14 },
  { label: "Default", px: 16 },
  { label: "Large", px: 18 },
  { label: "Extra Large", px: 20 },
  { label: "Huge", px: 22 },
];

export default function SettingsView({ fontSize, onChangeFontSize }) {
  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-y-auto p-5">
      <div className="mx-auto flex w-full max-w-lg flex-col gap-5">
        <div>
          <h2 className="flex items-center gap-2 text-lg font-bold text-cream">
            <span className="material-symbols-outlined text-brand-orange">settings</span>
            Settings
          </h2>
          <p className="mt-1 text-sm text-text-muted">Adjust the terminal to fit how you work.</p>
        </div>

        <div className="rounded-xl border border-cream/10 bg-surface-card p-4">
          <h3 className="text-sm font-bold text-cream">Display Size</h3>
          <p className="mt-1 text-xs text-text-muted">
            Makes text, buttons and spacing across the whole app bigger or smaller so it's clearly visible. Saved on this terminal.
          </p>

          <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3">
            {FONT_SIZES.map((option) => (
              <button
                key={option.px}
                type="button"
                onClick={() => onChangeFontSize(option.px)}
                className={`rounded-lg border py-2.5 text-sm font-bold transition ${
                  fontSize === option.px
                    ? "border-brand-orange bg-brand-orange text-white"
                    : "border-cream/10 bg-surface-input text-text-muted hover:text-cream"
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>

          <div className="mt-5 rounded-lg border border-dashed border-cream/15 bg-surface-input p-4 text-center">
            <p className="text-xs text-text-muted">Preview</p>
            <p className="mt-1 font-bold text-cream">Order #1042 — Rs 1,250.00</p>
            <button type="button" className="mt-3 rounded-lg bg-brand-orange px-4 py-2 text-sm font-bold text-white">
              Sample Button
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

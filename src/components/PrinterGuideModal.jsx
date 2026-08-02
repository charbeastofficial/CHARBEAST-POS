import { useState } from "react";

const SECTIONS = ["Setup", "Connect"];

export default function PrinterGuideModal({ onClose }) {
  const [tab, setTab] = useState("Setup");

  return (
    <div
      className="fixed inset-0 z-50 flex animate-[fadeIn_0.15s_ease-out] items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="relative flex w-full max-w-2xl animate-[popIn_0.2s_ease-out] flex-col rounded-2xl border border-cream/10 bg-surface-elevated shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-cream/10 p-4">
          <h2 className="text-lg font-bold text-cream">Printer Setup Guide</h2>
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-full text-text-muted transition hover:bg-cream/10 hover:text-cream"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 border-b border-cream/10 px-4 pt-3">
          {SECTIONS.map((s) => (
            <button
              key={s}
              onClick={() => setTab(s)}
              className={`rounded-t-lg px-4 py-2 text-xs font-bold transition ${
                tab === s
                  ? "bg-brand-orange text-white"
                  : "text-text-muted hover:bg-cream/5 hover:text-cream"
              }`}
            >
              {s}
            </button>
          ))}
        </div>

        <div className="max-h-[60vh] overflow-y-auto p-4 text-sm text-cream">
          {tab === "Setup" && <SetupTab />}
          {tab === "Connect" && <ConnectTab />}
        </div>
      </div>
    </div>
  );
}

function Section({ title, children }) {
  return (
    <div className="mb-5">
      <h3 className="mb-2 text-sm font-bold text-brand-orange">{title}</h3>
      <div className="flex flex-col gap-1.5 text-text-muted">{children}</div>
    </div>
  );
}

function Step({ n, children }) {
  return (
    <div className="flex gap-2.5">
      <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-brand-orange/20 text-[10px] font-bold text-brand-orange">
        {n}
      </span>
      <span className="text-xs leading-relaxed">{children}</span>
    </div>
  );
}

function Code({ children }) {
  return (
    <code className="inline-block rounded bg-cream/10 px-2 py-0.5 font-mono text-[11px] text-cream">
      {children}
    </code>
  );
}

function SetupTab() {
  return (
    <div className="flex flex-col gap-4">
      <p className="text-xs text-text-muted">
        Your thermal printer must have a <strong className="text-cream">static IP</strong> so the POS app always finds it at the same address.
      </p>

      <Section title="Option A — Via printer's web interface">
        <Step n={1}>
          Find the printer's current IP — hold the <strong>FEED</strong> button while powering on; the printer prints a config page with its IP.
        </Step>
        <Step n={2}>
          Open a browser and go to <Code>http://&lt;printer-ip&gt;</Code>
        </Step>
        <Step n={3}>
          Navigate to <strong>Network Settings → TCP/IP</strong>
        </Step>
        <Step n={4}>
          Change from <strong>DHCP</strong> to <strong>Mannual</strong>
        </Step>
        <Step n={5}>
          Set a fixed IP outside your router's DHCP range (e.g. <Code>192.168.18.50</Code>), Subnet Mask <Code>255.255.255.0</Code>, Gateway your router's IP.
        </Step>
        <Step n={6}>Save and reboot the printer.</Step>
      </Section>

      <Section title="Option B — Via router (DHCP reservation)">
        <Step n={1}>Log into your router's admin page.</Step>
        <Step n={2}>
          Find <strong>DHCP Reservation</strong> or <strong>Address Reservation</strong>.
        </Step>
        <Step n={3}>
          Add the printer's MAC address (printed on the config page or a sticker on the printer).
        </Step>
        <Step n={4}>Assign a fixed IP and save.</Step>
      </Section>
    </div>
  );
}

function ConnectTab() {
  return (
    <div className="flex flex-col gap-4">
      <p className="text-xs text-text-muted">
        The POS desktop app talks to the printer directly over your network — no extra software to run first.
      </p>

      <Section title="Connect via LAN">
        <Step n={1}>
          Click the <strong>printer icon</strong> in the left sidebar.
        </Step>
        <Step n={2}>
          Under <strong>LAN (Network)</strong>, enter your printer's static IP address.
        </Step>
        <Step n={3}>
          Click the <strong>Test Connection</strong> button (network icon) to verify the printer is reachable on port 9100.
        </Step>
        <Step n={4}>
          Click <strong>Connect</strong>. The IP is saved automatically — you only need to do this once.
        </Step>
      </Section>

      <div className="rounded-lg border border-brand-teal/20 bg-brand-teal/5 p-3 text-xs text-text-muted">
        <strong className="text-brand-teal">Tip:</strong> After connecting, the printer reconnects automatically on every launch. You only need to enter the IP once.
      </div>
    </div>
  );
}

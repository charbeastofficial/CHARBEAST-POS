import { useState, useEffect, useCallback } from "react";
import { checkPrinterReachable } from "../lib/printer";
import PrinterGuideModal from "./PrinterGuideModal";

const IPV4_RE = /^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/;

function isValidIP(str) {
  const m = str.trim().match(IPV4_RE);
  if (!m) return false;
  return m.slice(1).every((octet) => {
    const n = parseInt(octet, 10);
    return n >= 0 && n <= 255;
  });
}

export default function PrinterConnectModal({ connected, onConnectLAN, onDisconnect, onClose }) {
  const [ip, setIp] = useState("");
  const [connecting, setConnecting] = useState(false);
  const [error, setError] = useState("");
  const [testResult, setTestResult] = useState(null);
  const [testing, setTesting] = useState(false);
  const [showGuide, setShowGuide] = useState(false);

  useEffect(() => {
    if (connected) {
      try {
        const stored = localStorage.getItem("charbeast-pos-printer-ip");
        if (stored) setIp(stored);
      } catch {}
    }
  }, [connected]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  const testConnection = useCallback(async () => {
    const trimmed = ip.trim();
    if (!trimmed || !isValidIP(trimmed)) return;
    setTestResult(null);
    setTesting(true);
    const result = await checkPrinterReachable(trimmed);
    setTestResult(result);
    setTesting(false);
  }, [ip]);

  const validateAndConnect = useCallback(async () => {
    const trimmed = ip.trim();
    if (!trimmed) {
      setError("Enter the printer's IP address first.");
      return;
    }
    if (!isValidIP(trimmed)) {
      setError("Invalid IP address format. Use a valid IPv4 address, e.g. 192.168.18.100");
      return;
    }

    setError("");
    setConnecting(true);
    try {
      await onConnectLAN(trimmed);
      onClose();
    } catch (err) {
      console.error("LAN printer connect failed:", err);
      setError("Couldn't save the printer IP.");
    } finally {
      setConnecting(false);
    }
  }, [ip, onConnectLAN, onClose]);

  return (
    <>
    <div
      className="fixed inset-0 z-50 flex animate-[fadeIn_0.15s_ease-out] items-center justify-center bg-black/70 p-6 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="printer-modal-title"
        className="relative w-full max-w-[460px] animate-[popIn_0.2s_ease-out] rounded-2xl border border-cream/10 bg-surface-elevated p-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          aria-label="Close"
          className="absolute top-3.5 right-3.5 flex h-10 w-10 items-center justify-center rounded-full bg-cream/5 text-text-muted transition hover:bg-cream/10 hover:text-cream focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-orange"
          onClick={onClose}
        >
          <span className="material-symbols-outlined text-xl">close</span>
        </button>

        <div className="mb-3 flex items-center justify-between pr-9">
          <h2 id="printer-modal-title" className="text-xl text-cream">Connect Thermal Printer</h2>
          <button
            type="button"
            onClick={() => setShowGuide(true)}
            className="flex items-center gap-1 rounded-lg border border-cream/10 bg-surface-input px-2.5 py-1 text-[10px] font-bold text-text-muted transition hover:text-cream focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-orange"
          >
            <span className="material-symbols-outlined text-[14px]">help</span>
            Guide
          </button>
        </div>

        {connected && (
          <div className="mb-5 rounded-xl border border-brand-teal/20 bg-brand-teal/5 p-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-bold text-cream">Connected via LAN</p>
                <p className="text-xs text-text-muted mt-0.5">
                  Printer IP saved — reconnects automatically on page load.
                </p>
              </div>
              <button
                type="button"
                onClick={() => { onDisconnect?.(); onClose(); }}
                className="rounded-lg border border-brand-red/25 px-3 py-1.5 text-xs font-bold text-brand-red transition hover:bg-brand-red/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-red"
              >
                Disconnect
              </button>
            </div>
          </div>
        )}

        <div className="rounded-xl border border-cream/10 bg-surface-input p-4">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-bold text-cream">
              <span className="material-symbols-outlined text-[16px] align-text-bottom mr-1">lan</span>
              LAN (Network)
            </p>
            {connected && (
              <span className="rounded-full bg-brand-teal/15 px-2 py-0.5 text-[10px] font-bold text-brand-teal">Active</span>
            )}
          </div>
          <p className="mb-3 text-xs text-text-muted">
            Works over the network. Requires the printer and this till on the same subnet.
          </p>
          <div className="relative">
            <span className="material-symbols-outlined pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-[16px] text-text-dim">travel_explore</span>
            <input
              type="text"
              value={ip}
              onChange={(e) => { setIp(e.target.value); setTestResult(null); }}
              onKeyDown={(e) => { if (e.key === "Enter") { setTestResult(null); validateAndConnect(); } }}
              placeholder="Printer IP address, e.g. 192.168.18.100"
              disabled={connected}
              className="mb-2 w-full rounded-lg border border-cream/10 bg-surface-card pl-10 pr-3 py-2 text-sm text-cream placeholder:text-text-dim focus:border-brand-orange focus:ring-1 focus:ring-brand-orange focus:outline-none disabled:opacity-60"
            />
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              disabled={connecting || connected}
              onClick={validateAndConnect}
              className="flex-1 rounded-lg border border-cream/10 bg-surface-card-highest py-2.5 text-sm font-bold text-cream transition hover:bg-cream/10 disabled:cursor-not-allowed disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-orange"
            >
              {connecting ? "Connecting…" : connected ? "Connected" : "Connect"}
            </button>
            <button
              type="button"
              disabled={testing || !isValidIP(ip.trim()) || connected}
              onClick={testConnection}
              className="rounded-lg border border-cream/10 bg-surface-card px-3 py-2.5 text-sm font-bold text-text-muted transition hover:bg-cream/5 hover:text-cream disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-orange"
              title="Test if the printer is reachable at this IP"
            >
              {testing ? (
                <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-cream/15 border-t-brand-orange" />
              ) : (
                <span className="material-symbols-outlined text-[18px]">network_check</span>
              )}
            </button>
          </div>
          {testResult && (
            <div className={`mt-2 flex items-center gap-1.5 text-xs ${testResult.reachable ? "text-brand-green" : "text-brand-red"}`}>
              <span className="material-symbols-outlined text-[14px]">{testResult.reachable ? "check_circle" : "error"}</span>
              {testResult.reachable ? "Printer is reachable on port 9100" : testResult.error || "Printer is not responding"}
            </div>
          )}
        </div>

        {error && (
          <div className="mt-4 flex items-start gap-2 rounded-lg border border-brand-red/20 bg-brand-red/5 px-3 py-2.5">
            <span className="material-symbols-outlined text-[16px] text-brand-red shrink-0 mt-0.5">warning</span>
            <p className="text-sm font-medium text-brand-red">{error}</p>
          </div>
        )}
      </div>
    </div>

    {showGuide && <PrinterGuideModal onClose={() => setShowGuide(false)} />}
  </>
  );
}

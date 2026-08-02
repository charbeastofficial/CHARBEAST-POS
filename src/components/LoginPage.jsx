import React, { useState } from 'react';
import Logo from './Logo.jsx';

export default function LoginPage({ onLogin }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [rememberMe, setRememberMe] = useState(true);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      await onLogin(email, password, rememberMe);
    } catch (err) {
      setError(err.message || 'Failed to login');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-gradient-to-br from-surface to-surface-card px-4">
      <div className="pointer-events-none absolute inset-0 opacity-25">
        <div className="absolute -top-[10%] -left-[10%] h-[50%] w-[50%] rounded-full bg-brand-orange blur-[120px] mix-blend-multiply" />
        <div className="absolute -right-[10%] -bottom-[10%] h-[60%] w-[60%] rounded-full bg-brand-teal blur-[150px] mix-blend-multiply" />
      </div>

      <div className="relative z-10 mx-auto w-full max-w-[420px]">
        <Logo />

        <div className="rounded-xl border border-cream/10 bg-surface-card p-8 shadow-[0_20px_40px_rgba(0,0,0,0.15)]">
          <form onSubmit={handleSubmit} className="flex flex-col gap-6">
            {error && (
              <div className="rounded-lg border border-brand-red/25 bg-brand-red-deep/10 px-4 py-3.5 text-sm font-semibold text-brand-red">
                {error}
              </div>
            )}

            <div>
              <label htmlFor="email" className="mb-2 block text-sm font-bold text-text-muted">
                Email address
              </label>
              <div className="relative">
                <span className="material-symbols-outlined pointer-events-none absolute top-1/2 left-4 -translate-y-1/2 text-text-dim">
                  mail
                </span>
                <input
                  type="email"
                  id="email"
                  placeholder="cashier@charbeast.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  disabled={loading}
                  className="w-full rounded-lg border border-cream/10 bg-surface-input py-3 pr-4 pl-12 text-cream transition-colors placeholder:text-text-dim focus:border-brand-orange focus:ring-1 focus:ring-brand-orange focus:outline-none disabled:opacity-60"
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="mb-2 block text-sm font-bold text-text-muted">
                Password
              </label>
              <div className="relative">
                <span className="material-symbols-outlined pointer-events-none absolute top-1/2 left-4 -translate-y-1/2 text-text-dim">
                  lock
                </span>
                <input
                  type="password"
                  id="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  disabled={loading}
                  className="w-full rounded-lg border border-cream/10 bg-surface-input py-3 pr-4 pl-12 text-cream transition-colors placeholder:text-text-dim focus:border-brand-orange focus:ring-1 focus:ring-brand-orange focus:outline-none disabled:opacity-60"
                />
              </div>
            </div>

            <label className="flex cursor-pointer items-center gap-3 py-1">
              <input
                id="remember-me"
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="h-5 w-5 rounded border-cream/10 bg-surface-input text-brand-orange focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-orange"
              />
              <span className="text-sm text-text-muted">
                Remember me
              </span>
            </label>

            <button
              type="submit"
              disabled={loading}
              className="flex w-full justify-center rounded-lg bg-brand-orange px-4 py-3 text-sm font-bold text-white shadow-sm transition-colors hover:bg-[#e64a19] focus:ring-2 focus:ring-brand-orange focus:ring-offset-2 focus:ring-offset-surface focus:outline-none disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>
        </div>

        <p className="mt-6 text-center text-xs text-text-dim">
          Ask your admin to create or reset your account from the CharBeast admin panel.
        </p>
      </div>
    </div>
  );
}

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn(
    'Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY. Copy pos-app/.env.example to .env and fill in your Supabase project credentials.'
  );
}

const REMEMBER_KEY = 'charbeast_remember_me';

// "Remember me" toggles where the session itself is kept: localStorage
// (survives closing the browser) when checked, sessionStorage (cleared when
// the tab/browser closes) when not. The choice flag always lives in
// localStorage -- it's not sensitive, and a returning tab needs a stable
// place to look up which storage to check. Defaults to remembered so
// existing logged-in sessions (from before this flag existed) aren't lost.
function isRemembered() {
  try {
    return localStorage.getItem(REMEMBER_KEY) !== '0';
  } catch {
    return true;
  }
}

export function setRememberMe(remember) {
  try {
    localStorage.setItem(REMEMBER_KEY, remember ? '1' : '0');
  } catch {
    // private browsing etc. -- falls back to always-remembered this tab
  }
}

const dynamicStorage = {
  getItem: (key) => (isRemembered() ? localStorage : sessionStorage).getItem(key),
  setItem: (key, value) => (isRemembered() ? localStorage : sessionStorage).setItem(key, value),
  removeItem: (key) => (isRemembered() ? localStorage : sessionStorage).removeItem(key),
};

export const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseAnonKey || 'placeholder-key',
  { auth: { storage: dynamicStorage } }
);

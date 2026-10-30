/* In-browser data store for the standalone demo: seed data + this browser's changes. */
import seed from "./seed.json";

/* eslint-disable @typescript-eslint/no-explicit-any */
export type Row = Record<string, any>;
export type State = {
  settings: Record<string, any>;
  artists: Row[];
  venues: Row[];
  events: Row[];
  projects: Row[];
  media: Row[];
  leads: Row[];
  orders: Row[];
  session: { email: string; name: string } | null;
};

const KEY = "sofit-demo-v1";

function shiftSeed(): State {
  // Keep the afisha in the future: move every date by the time since the export.
  const day = 86400000;
  const delta = Math.round((Date.now() - new Date(seed.exportedAt).getTime()) / day) * day;
  const sh = (v: string | null) => (v ? new Date(new Date(v).getTime() + delta).toISOString() : v);
  const s = JSON.parse(JSON.stringify(seed));
  for (const e of s.events) {
    e.startsAt = sh(e.startsAt);
    e.doorsAt = sh(e.doorsAt);
  }
  for (const t of ["leads", "orders", "media"]) for (const r of s[t]) r.createdAt = sh(r.createdAt);
  return { ...s, session: null };
}

function load(): State {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) return JSON.parse(raw);
  } catch {
    /* storage blocked: fall back to seed */
  }
  return shiftSeed();
}

let state: State = load();
let version = 0;
const listeners = new Set<() => void>();
let saveTimer: ReturnType<typeof setTimeout> | undefined;

export const store = {
  get: () => state,
  version: () => version,
  subscribe(fn: () => void) {
    listeners.add(fn);
    return () => listeners.delete(fn);
  },
  update(fn: (s: State) => void) {
    fn(state);
    state = { ...state };
    version++;
    listeners.forEach((l) => l());
    clearTimeout(saveTimer);
    saveTimer = setTimeout(() => {
      try {
        localStorage.setItem(KEY, JSON.stringify(state));
      } catch {
        /* quota exceeded or storage blocked: changes stay in memory */
      }
    }, 150);
  },
  reset() {
    try {
      localStorage.removeItem(KEY);
    } catch {}
    state = shiftSeed();
    version++;
    listeners.forEach((l) => l());
  },
  nextId(table: keyof State) {
    const rows = state[table] as Row[];
    return rows.reduce((m, r) => Math.max(m, r.id ?? 0), 0) + 1;
  },
};

/* Hash router for the demo. App paths (/concerts/x) map to plain hash names (#event-x),
   which is the only kind of hash the artifact host passes through. */
import { createContext, useContext, useEffect, useSyncExternalStore } from "react";

type Loc = { path: string; search: string };

export function pathToHash(path: string): string {
  const p = path.replace(/\/+$/, "") || "/";
  if (p === "/") return "";
  let m: RegExpMatchArray | null;
  if ((m = p.match(/^\/concerts\/([\w-]+)$/))) return `event-${m[1]}`;
  if ((m = p.match(/^\/portfolio\/([\w-]+)$/))) return `project-${m[1]}`;
  if (p === "/admin/login") return "admin-login";
  if ((m = p.match(/^\/admin\/(\w+)\/(new|\d+)$/))) return `admin-${m[1]}-${m[2]}`;
  if ((m = p.match(/^\/admin\/(\w+)$/))) return `admin-${m[1]}`;
  return p.slice(1).replace(/\//g, "-");
}

const ROUTES = ["concerts", "services", "portfolio", "contacts", "admin"];
export function hashToPath(hash: string): string | null {
  const h = hash.replace(/^#/, "");
  if (!h) return "/";
  let m: RegExpMatchArray | null;
  if ((m = h.match(/^event-([\w-]+)$/))) return `/concerts/${m[1]}`;
  if ((m = h.match(/^project-([\w-]+)$/))) return `/portfolio/${m[1]}`;
  if (h === "admin-login") return "/admin/login";
  if ((m = h.match(/^admin-(events|artists|venues|projects)-(new|\d+)$/))) return `/admin/${m[1]}/${m[2]}`;
  if ((m = h.match(/^admin-(\w+)$/))) return `/admin/${m[1]}`;
  if (ROUTES.includes(h)) return `/${h}`;
  return null; // in-page anchor such as #tickets
}

let loc: Loc = { path: hashToPath(location.hash) ?? "/", search: "" };
const subs = new Set<() => void>();
const emit = () => subs.forEach((f) => f());
let pendingAnchor: string | null = null;

function setHash(path: string, replace: boolean) {
  const h = pathToHash(path);
  try {
    if (replace) history.replaceState(null, "", `${location.pathname}${location.search}${h ? "#" + h : ""}`);
    else if (location.hash.replace(/^#/, "") !== h) location.hash = h;
  } catch {
    /* some hosts forbid history changes; routing still works in memory */
  }
}

export function navigate(href: string, opts: { replace?: boolean; scroll?: boolean } = {}) {
  if (/^(https?:|mailto:|tel:)/.test(href)) {
    window.open(href, "_blank", "noopener");
    return;
  }
  if (href.startsWith("#")) {
    scrollToAnchor(href.slice(1));
    return;
  }
  const [rest, anchor] = href.split("#");
  const [path, search = ""] = rest.split("?");
  const samePath = path === loc.path;
  loc = { path: path || "/", search };
  setHash(loc.path, !!opts.replace || samePath);
  pendingAnchor = anchor ?? null;
  if (!samePath && opts.scroll !== false && !anchor) {
    window.__lenis?.scrollTo(0, { immediate: true });
    window.scrollTo(0, 0);
  }
  emit();
}

export function scrollToAnchor(id: string) {
  const el = document.getElementById(id);
  if (!el) return;
  if (window.__lenis) window.__lenis.scrollTo(el, { offset: -80 });
  else el.scrollIntoView({ behavior: "smooth" });
}

window.addEventListener("hashchange", () => {
  const p = hashToPath(location.hash);
  if (p === null) {
    scrollToAnchor(location.hash.slice(1));
    return;
  }
  if (p !== loc.path) {
    loc = { path: p, search: "" };
    window.scrollTo(0, 0);
    emit();
  }
});
window.addEventListener("popstate", () => {
  const p = hashToPath(location.hash);
  if (p !== null && p !== loc.path) {
    loc = { path: p, search: "" };
    emit();
  }
});

export function useLocation(): Loc {
  const snap = useSyncExternalStore(
    (f) => {
      subs.add(f);
      return () => subs.delete(f);
    },
    () => loc,
  );
  useEffect(() => {
    if (pendingAnchor) {
      const a = pendingAnchor;
      pendingAnchor = null;
      setTimeout(() => scrollToAnchor(a), 120);
    }
  });
  return snap;
}

export const ParamsContext = createContext<Record<string, string>>({});
export const useRouteParams = () => useContext(ParamsContext);

declare global {
  interface Window {
    __navigate: (href: string) => void;
  }
}
window.__navigate = (href) => navigate(href, { replace: true });

"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Logo } from "@/components/Logo";
import { ToastProvider } from "./Toast";
import { api } from "./client";

const NAV = [
  { href: "/admin", label: "Обзор", icon: "M3 12l9-8 9 8M5 10v10h14V10" },
  { href: "/admin/events", label: "Концерты", icon: "M4 6h16M4 12h16M4 18h10" },
  { href: "/admin/artists", label: "Артисты", icon: "M12 12a4 4 0 100-8 4 4 0 000 8zm-7 9a7 7 0 0114 0" },
  { href: "/admin/venues", label: "Площадки", icon: "M12 21s-7-6.5-7-12a7 7 0 0114 0c0 5.5-7 12-7 12zm0-9a3 3 0 100-6 3 3 0 000 6z" },
  { href: "/admin/projects", label: "Портфолио", icon: "M4 5h16v14H4zM4 15l5-5 4 4 3-3 4 4" },
  { href: "/admin/media", label: "Медиатека", icon: "M4 4h16v16H4zM9 9.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0zM20 16l-5-5-9 9" },
  { href: "/admin/leads", label: "Заявки", icon: "M4 4h16v12H7l-3 4z" },
  { href: "/admin/orders", label: "Заказы билетов", icon: "M4 8V5h16v3a2 2 0 000 4v3H4v-3a2 2 0 000-4z" },
  { href: "/admin/content", label: "Содержимое сайта", icon: "M4 4h10l6 6v10H4zM14 4v6h6" },
];

export function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [me, setMe] = useState<{ name: string; email: string } | null>(null);
  const [open, setOpen] = useState(false);
  const bare = pathname === "/admin/login";

  useEffect(() => {
    if (bare) return;
    api<{ data: { name: string; email: string } }>("/api/auth/me").then((r) => setMe(r.data)).catch(() => {});
  }, [bare]);
  const [prevPath, setPrevPath] = useState(pathname);
  if (prevPath !== pathname) {
    setPrevPath(pathname);
    setOpen(false);
  }

  if (bare) return <ToastProvider>{children}</ToastProvider>;

  const logout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    router.replace("/admin/login");
    router.refresh();
  };
  const isActive = (href: string) => (href === "/admin" ? pathname === "/admin" : pathname.startsWith(href));

  return (
    <ToastProvider>
      <div className="min-h-dvh bg-[#070707] text-paper lg:grid lg:grid-cols-[260px_1fr]">
        <aside
          className={`fixed inset-y-0 left-0 z-40 w-[260px] border-r border-[var(--line)] bg-black transition-transform duration-500 lg:sticky lg:top-0 lg:h-dvh lg:translate-x-0 ${
            open ? "translate-x-0" : "-translate-x-full"
          }`}
        >
          <div className="flex h-16 items-center justify-between px-6">
            <Link href="/admin" className="flex items-center gap-3">
              <Logo className="h-5 w-auto" />
              <span className="rounded-full border border-[var(--line-strong)] px-2 py-0.5 text-[11px] text-dim">admin</span>
            </Link>
          </div>
          <nav className="px-3 py-4" aria-label="Разделы админ-панели">
            <ul className="space-y-0.5">
              {NAV.map((n) => (
                <li key={n.href}>
                  <Link
                    href={n.href}
                    aria-current={isActive(n.href) ? "page" : undefined}
                    className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-[0.95rem] text-paper/70 transition-colors hover:bg-white/5 hover:text-paper aria-[current=page]:bg-white/[0.07] aria-[current=page]:text-paper"
                  >
                    <svg viewBox="0 0 24 24" className="h-[18px] w-[18px] shrink-0" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" aria-hidden>
                      <path d={n.icon} />
                    </svg>
                    {n.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
          <div className="absolute inset-x-0 bottom-0 border-t border-[var(--line)] p-4">
            <p className="truncate text-sm">{me?.name ?? "…"}</p>
            <p className="truncate text-xs text-dim">{me?.email}</p>
            <div className="mt-3 flex gap-2">
              <Link href="/" className="flex-1 rounded-md border border-[var(--line-strong)] px-3 py-2 text-center text-xs hover:border-paper">
                Открыть сайт
              </Link>
              <button type="button" onClick={logout} className="flex-1 rounded-md border border-[var(--line-strong)] px-3 py-2 text-xs hover:border-danger hover:text-danger">
                Выйти
              </button>
            </div>
          </div>
        </aside>
        {open && <button aria-label="Закрыть меню" className="fixed inset-0 z-30 bg-black/60 lg:hidden" onClick={() => setOpen(false)} />}

        <div className="min-w-0">
          <div className="sticky top-0 z-20 flex h-14 items-center gap-3 border-b border-[var(--line)] bg-[#070707]/90 px-4 backdrop-blur lg:hidden">
            <button type="button" onClick={() => setOpen(true)} className="grid h-10 w-10 place-items-center rounded-lg border border-[var(--line-strong)]" aria-label="Открыть меню">
              <svg viewBox="0 0 24 24" className="h-5 w-5" stroke="currentColor" strokeWidth="1.6" aria-hidden>
                <path d="M4 7h16M4 12h16M4 17h16" />
              </svg>
            </button>
            <Logo className="h-4 w-auto" />
          </div>
          <main className="mx-auto max-w-[1280px] px-4 py-8 md:px-8 md:py-10">{children}</main>
        </div>
      </div>
    </ToastProvider>
  );
}

export function PageHead({ title, sub, actions }: { title: string; sub?: string; actions?: React.ReactNode }) {
  return (
    <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="font-display text-3xl font-light tracking-tight md:text-4xl">{title}</h1>
        {sub && <p className="mt-2 text-dim">{sub}</p>}
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </div>
  );
}

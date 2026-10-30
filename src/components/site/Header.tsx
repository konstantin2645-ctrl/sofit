"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Logo } from "@/components/Logo";

const NAV = [
  { href: "/concerts", label: "Афиша" },
  { href: "/services", label: "Услуги" },
  { href: "/portfolio", label: "Проекты" },
  { href: "/contacts", label: "Контакты" },
];

type HeaderProps = { phone: string; email: string };

/** usePathname() needs a Suspense boundary for routes with unknown params; the fallback is the same header without the active state. */
export function Header(props: HeaderProps) {
  return (
    <Suspense fallback={<HeaderView {...props} pathname="" />}>
      <HeaderWithPath {...props} />
    </Suspense>
  );
}

function HeaderWithPath(props: HeaderProps) {
  const pathname = usePathname();
  return <HeaderView {...props} pathname={pathname} />;
}

function HeaderView({ phone, email, pathname }: HeaderProps & { pathname: string }) {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const [prevPath, setPrevPath] = useState(pathname);
  if (prevPath !== pathname) {
    setPrevPath(pathname);
    setOpen(false);
  }

  useEffect(() => {
    document.documentElement.style.overflow = open ? "hidden" : "";
    if (open) window.__lenis?.stop();
    else window.__lenis?.start();
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  const active = (href: string) => pathname === href || pathname.startsWith(href + "/");

  return (
    <>
      <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:bg-paper focus:px-4 focus:py-2 focus:text-black">
        Перейти к содержанию
      </a>
      <header
        className={`fixed inset-x-0 top-0 z-50 transition-[background-color,backdrop-filter,border-color] duration-500 ${
          scrolled && !open ? "border-b border-[var(--line)] bg-black/70 backdrop-blur-xl" : "border-b border-transparent"
        }`}
      >
        <div className="wrap flex h-16 items-center justify-between gap-6 md:h-20">
          <Link href="/" aria-label="SOFIT — на главную" className="relative z-10 text-paper">
            <Logo className="h-[22px] w-auto md:h-[26px]" />
          </Link>

          <nav aria-label="Основная навигация" className="hidden md:block">
            <ul className="flex items-center gap-1">
              {NAV.map((n) => (
                <li key={n.href}>
                  <Link
                    href={n.href}
                    aria-current={active(n.href) ? "page" : undefined}
                    className="group relative block px-4 py-2 text-[0.95rem] text-paper/80 transition-colors hover:text-paper aria-[current=page]:text-paper"
                  >
                    {n.label}
                    <span
                      aria-hidden
                      className={`absolute bottom-0.5 left-1/2 h-1 w-1 -translate-x-1/2 rounded-full bg-spot shadow-[0_0_12px_2px_var(--color-spot)] transition-opacity duration-300 ${
                        active(n.href) ? "opacity-100" : "opacity-0 group-hover:opacity-60"
                      }`}
                    />
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <div className="flex items-center gap-3">
            <Link href="/concerts" className="btn btn-light hidden !h-11 !px-5 text-sm sm:inline-flex">
              Купить билет
            </Link>
            <button
              type="button"
              onClick={() => setOpen((v) => !v)}
              className="relative z-10 grid h-11 w-11 place-items-center rounded-full border border-[var(--line-strong)] md:hidden"
              aria-expanded={open}
              aria-controls="mobile-menu"
              aria-label={open ? "Закрыть меню" : "Открыть меню"}
            >
              <span className="relative block h-3 w-5">
                <span className={`absolute left-0 h-px w-5 bg-paper transition-all duration-500 ${open ? "top-1.5 rotate-45" : "top-0"}`} />
                <span className={`absolute left-0 h-px w-5 bg-paper transition-all duration-500 ${open ? "top-1.5 -rotate-45" : "top-3"}`} />
              </span>
            </button>
          </div>
        </div>
      </header>

      <AnimatePresence>
        {open && (
          <motion.div
            id="mobile-menu"
            role="dialog"
            aria-modal="true"
            aria-label="Меню"
            className="fixed inset-0 z-40 flex flex-col bg-black md:hidden"
            initial={{ clipPath: "circle(0% at calc(100% - 38px) 32px)" }}
            animate={{ clipPath: "circle(150% at calc(100% - 38px) 32px)" }}
            exit={{ clipPath: "circle(0% at calc(100% - 38px) 32px)" }}
            transition={{ duration: 0.7, ease: [0.76, 0, 0.24, 1] }}
          >
            <nav aria-label="Мобильная навигация" className="wrap flex flex-1 flex-col justify-center pt-16">
              <ul className="space-y-2">
                {[{ href: "/", label: "Главная" }, ...NAV].map((n, i) => (
                  <motion.li
                    key={n.href}
                    initial={{ opacity: 0, y: 40 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.25 + i * 0.06, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
                  >
                    <Link
                      href={n.href}
                      className="display block py-1 text-[clamp(2.4rem,11vw,4rem)] text-paper aria-[current=page]:text-spot"
                      aria-current={pathname === n.href ? "page" : undefined}
                    >
                      {n.label}
                    </Link>
                  </motion.li>
                ))}
              </ul>
            </nav>
            <motion.div
              className="wrap space-y-1 pb-10 text-dim"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6 }}
            >
              <a href={`tel:${phone.replace(/[^\d+]/g, "")}`} className="block text-lg text-paper">
                {phone}
              </a>
              <a href={`mailto:${email}`} className="block">
                {email}
              </a>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

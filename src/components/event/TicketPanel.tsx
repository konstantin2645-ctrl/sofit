"use client";

import { useRouter } from "next/navigation";
import { useEffect, useId, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";

export type TierView = { name: string; price: number; left: number; total: number; note?: string };

type Props = {
  eventId: number;
  title: string;
  dateLabel: string;
  place: string;
  currency: string;
  status: string;
  ticketUrl: string | null;
  tiers: TierView[];
};

const fmt = (n: number, c: string) => `${new Intl.NumberFormat("ru-RU").format(n)} ${c}`;

export function TicketPanel(p: Props) {
  const [open, setOpen] = useState(false);
  const [tier, setTier] = useState<string | null>(null);
  const available = p.status === "published" && p.tiers.some((t) => t.left > 0);

  const choose = (name: string) => {
    setTier(name);
    setOpen(true);
  };

  return (
    <div id="tickets" className="scroll-mt-28">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {p.tiers.map((t) => {
          const soldOut = t.left <= 0 || p.status !== "published";
          const pct = t.total ? Math.round(((t.total - t.left) / t.total) * 100) : 100;
          return (
            <button
              key={t.name}
              type="button"
              disabled={soldOut}
              onClick={() => choose(t.name)}
              className="group relative flex min-h-[11rem] flex-col justify-between overflow-hidden rounded-sm border border-[var(--line-strong)] p-6 text-left transition-colors duration-500 enabled:hover:border-[var(--gel)] disabled:opacity-50"
            >
              <span
                aria-hidden
                className="absolute inset-0 -z-10 opacity-0 transition-opacity duration-700 group-enabled:group-hover:opacity-100"
                style={{ background: "radial-gradient(120% 90% at 0% 0%, color-mix(in oklab, var(--gel) 22%, transparent), transparent 60%)" }}
              />
              <span>
                <span className="h-card block">{t.name}</span>
                {t.note && <span className="mt-1 block text-sm text-dim">{t.note}</span>}
              </span>
              <span className="mt-6 block">
                <span className="flex items-end justify-between gap-4">
                  <span className="display text-[2rem] leading-none">{fmt(t.price, p.currency)}</span>
                  <span className="text-sm text-dim">
                    {soldOut ? "Нет в продаже" : t.left < 50 ? `Осталось ${t.left}` : "В продаже"}
                  </span>
                </span>
                <span className="mt-4 block h-px w-full bg-[var(--line)]">
                  <span className="block h-px bg-[var(--gel)]" style={{ width: `${pct}%` }} />
                </span>
              </span>
            </button>
          );
        })}
      </div>

      <div className="mt-8 flex flex-wrap items-center gap-4">
        <button type="button" className="btn btn-light" disabled={!available} onClick={() => choose(p.tiers.find((t) => t.left > 0)?.name ?? "")}>
          {available ? "Купить билет" : p.status === "cancelled" ? "Концерт отменён" : "Билеты проданы"}
        </button>
        {p.ticketUrl && (
          <a href={p.ticketUrl} target="_blank" rel="noopener noreferrer" className="btn btn-ghost">
            Купить у билетного оператора
          </a>
        )}
        <p className="meta max-w-sm">Электронный билет придёт на почту. Вернуть билет можно за 10 дней до концерта.</p>
      </div>

      <AnimatePresence>
        {open && tier && (
          <CheckoutDialog key="dlg" {...p} tier={tier} setTier={setTier} onClose={() => setOpen(false)} />
        )}
      </AnimatePresence>
    </div>
  );
}

function CheckoutDialog(p: Props & { tier: string; setTier: (t: string) => void; onClose: () => void }) {
  const router = useRouter();
  const titleId = useId();
  const dialog = useRef<HTMLDivElement>(null);
  const [qtyRaw, setQty] = useState(1);
  const [step, setStep] = useState<"form" | "done">("form");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [result, setResult] = useState<{ code: string; amount: number; quantity: number; tier: string } | null>(null);

  const t = p.tiers.find((x) => x.name === p.tier)!;
  const max = Math.max(1, Math.min(10, t?.left ?? 1));
  const qty = Math.min(qtyRaw, max);
  const total = (t?.price ?? 0) * qty;

  useEffect(() => {
    window.__lenis?.stop();
    const prev = document.activeElement as HTMLElement | null;
    dialog.current?.querySelector<HTMLElement>("select, input, button")?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") p.onClose();
      if (e.key === "Tab" && dialog.current) {
        const f = [...dialog.current.querySelectorAll<HTMLElement>("button, input, select, a[href]")].filter((x) => !x.hasAttribute("disabled"));
        if (!f.length) return;
        if (e.shiftKey && document.activeElement === f[0]) {
          e.preventDefault();
          f[f.length - 1].focus();
        } else if (!e.shiftKey && document.activeElement === f[f.length - 1]) {
          e.preventDefault();
          f[0].focus();
        }
      }
    };
    document.addEventListener("keydown", onKey);
    document.documentElement.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.documentElement.style.overflow = "";
      window.__lenis?.start();
      prev?.focus();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);


  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    setBusy(true);
    setError(null);
    setFieldErrors({});
    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          eventId: p.eventId,
          tier: p.tier,
          quantity: qty,
          name: fd.get("name"),
          email: fd.get("email"),
          phone: fd.get("phone") ?? "",
          consent: fd.get("consent") === "on",
        }),
      });
      const json = await res.json();
      if (!res.ok) {
        if (Array.isArray(json.details)) {
          setFieldErrors(Object.fromEntries(json.details.map((d: { path: string; message: string }) => [d.path, d.message])));
        }
        setError(json.error ?? "Не удалось оформить заказ");
        return;
      }
      setResult(json.data);
      setStep("done");
      router.refresh();
    } catch {
      setError("Нет связи с сервером. Проверьте интернет и попробуйте ещё раз.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <motion.div
      className="fixed inset-0 z-[60] flex items-end justify-center bg-black/70 backdrop-blur-sm md:items-center"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onMouseDown={(e) => e.target === e.currentTarget && p.onClose()}
    >
      <motion.div
        ref={dialog}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        data-lenis-prevent
        className="relative max-h-[92dvh] w-full max-w-xl overflow-y-auto rounded-t-2xl border border-[var(--line-strong)] bg-[#0b0a09] p-6 md:rounded-2xl md:p-10"
        initial={{ y: 60, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 40, opacity: 0 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      >
        <button type="button" onClick={p.onClose} className="absolute right-4 top-4 grid h-10 w-10 place-items-center rounded-full border border-[var(--line)] text-dim hover:text-paper" aria-label="Закрыть">
          <svg viewBox="0 0 24 24" className="h-4 w-4" stroke="currentColor" strokeWidth="1.8" aria-hidden>
            <path d="M5 5l14 14M19 5 5 19" />
          </svg>
        </button>

        {step === "form" ? (
          <form onSubmit={submit} noValidate>
            <p className="meta">{p.dateLabel}, {p.place}</p>
            <h2 id={titleId} className="h-card mt-2 pr-10 text-2xl">
              {p.title}
            </h2>

            <div className="mt-8 grid gap-6 sm:grid-cols-[1fr_auto]">
              <label className="field">
                <span>Категория</span>
                <select className="input" value={p.tier} onChange={(e) => p.setTier(e.target.value)}>
                  {p.tiers.map((x) => (
                    <option key={x.name} value={x.name} disabled={x.left <= 0}>
                      {x.name}, {fmt(x.price, p.currency)}
                      {x.left <= 0 ? " (нет мест)" : ""}
                    </option>
                  ))}
                </select>
              </label>
              <div className="field">
                <span id={`${titleId}-qty`}>Количество</span>
                <div className="flex items-center gap-1" role="group" aria-labelledby={`${titleId}-qty`}>
                  <button type="button" className="grid h-11 w-11 place-items-center rounded-full border border-[var(--line-strong)] text-lg disabled:opacity-30" onClick={() => setQty(Math.max(1, qty - 1))} disabled={qty <= 1} aria-label="Меньше">
                    −
                  </button>
                  <output className="w-10 text-center font-display text-xl tabular-nums" aria-live="polite">
                    {qty}
                  </output>
                  <button type="button" className="grid h-11 w-11 place-items-center rounded-full border border-[var(--line-strong)] text-lg disabled:opacity-30" onClick={() => setQty(Math.min(max, qty + 1))} disabled={qty >= max} aria-label="Больше">
                    +
                  </button>
                </div>
              </div>
            </div>

            <div className="mt-6 grid gap-6">
              <label className="field">
                <span>Имя и фамилия</span>
                <input name="name" className="input" autoComplete="name" required aria-invalid={!!fieldErrors.name} />
                {fieldErrors.name && <small className="text-danger">{fieldErrors.name}</small>}
              </label>
              <div className="grid gap-6 sm:grid-cols-2">
                <label className="field">
                  <span>Почта для билетов</span>
                  <input name="email" type="email" className="input" autoComplete="email" inputMode="email" required aria-invalid={!!fieldErrors.email} />
                  {fieldErrors.email && <small className="text-danger">{fieldErrors.email}</small>}
                </label>
                <label className="field">
                  <span>Телефон (необязательно)</span>
                  <input name="phone" type="tel" className="input" autoComplete="tel" inputMode="tel" aria-invalid={!!fieldErrors.phone} />
                  {fieldErrors.phone && <small className="text-danger">{fieldErrors.phone}</small>}
                </label>
              </div>
              <label className="flex items-start gap-3 text-sm text-dim">
                <input name="consent" type="checkbox" className="mt-1 h-4 w-4 accent-[var(--color-spot)]" required />
                <span>Соглашаюсь с правилами покупки и обработкой персональных данных</span>
              </label>
              {fieldErrors.consent && <small className="-mt-4 text-danger">{fieldErrors.consent}</small>}
            </div>

            {error && (
              <p role="alert" className="mt-6 rounded-md border border-danger/40 bg-danger/10 px-4 py-3 text-sm text-danger">
                {error}
              </p>
            )}

            <div className="mt-8 flex items-center justify-between gap-4 border-t border-[var(--line)] pt-6">
              <p>
                <span className="meta block">К оплате</span>
                <span className="display text-3xl">{fmt(total, p.currency)}</span>
              </p>
              <button type="submit" className="btn btn-light" disabled={busy}>
                {busy ? "Оформляем…" : "Оформить заказ"}
              </button>
            </div>
          </form>
        ) : (
          <div className="py-4 text-center">
            <motion.div
              aria-hidden
              className="mx-auto h-20 w-20 rounded-full"
              style={{ background: "radial-gradient(circle, #fff 0 18%, var(--color-spot) 19% 42%, transparent 43%)", boxShadow: "0 0 60px 16px rgb(255 197 110 / .35)" }}
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 200, damping: 14 }}
            />
            <h2 id={titleId} className="h-card mt-8 text-2xl">
              Заказ оформлен
            </h2>
            <p className="mt-3 text-dim">
              Номер заказа <strong className="text-paper">{result?.code}</strong>. {result?.quantity}{" "}
              {result?.quantity === 1 ? "билет" : result && result.quantity < 5 ? "билета" : "билетов"} в категории «{result?.tier}» на сумму{" "}
              {result && fmt(result.amount, p.currency)} забронированы на 30 минут. Ссылку на оплату и электронные билеты отправим на почту.
            </p>
            <button type="button" className="btn btn-ghost mt-8" onClick={p.onClose}>
              Готово
            </button>
          </div>
        )}
      </motion.div>
    </motion.div>
  );
}

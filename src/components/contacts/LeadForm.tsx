"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "motion/react";

const TYPES = [
  { value: "festival", label: "Концерт или фестиваль" },
  { value: "artist", label: "Тур артиста" },
  { value: "corporate", label: "Корпоративное событие" },
  { value: "partnership", label: "Партнёрство и спонсорство" },
  { value: "other", label: "Другое" },
];

const BUDGETS = ["До 3 млн ₽", "3–10 млн ₽", "10–30 млн ₽", "Больше 30 млн ₽", "Пока не знаю"];

export function LeadForm() {
  const [type, setType] = useState("festival");
  const [state, setState] = useState<"idle" | "sending" | "sent">("idle");
  const [error, setError] = useState<string | null>(null);
  const [errs, setErrs] = useState<Record<string, string>>({});

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const fd = new FormData(form);
    setState("sending");
    setError(null);
    setErrs({});
    try {
      const res = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type,
          name: fd.get("name"),
          company: fd.get("company") ?? "",
          email: fd.get("email"),
          phone: fd.get("phone") ?? "",
          budget: fd.get("budget") ?? "",
          eventDate: fd.get("eventDate") ?? "",
          message: fd.get("message"),
          consent: fd.get("consent") === "on",
          website: fd.get("website") ?? "",
        }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        if (Array.isArray(json.details)) setErrs(Object.fromEntries(json.details.map((d: { path: string; message: string }) => [d.path, d.message])));
        setError(json.error ?? "Не удалось отправить заявку");
        setState("idle");
        return;
      }
      form.reset();
      setState("sent");
    } catch {
      setError("Нет связи с сервером. Проверьте интернет и попробуйте ещё раз.");
      setState("idle");
    }
  }

  const err = (k: string) =>
    errs[k] ? (
      <small id={`err-${k}`} className="text-danger">
        {errs[k]}
      </small>
    ) : null;

  return (
    <div className="relative">
      <AnimatePresence mode="wait">
        {state === "sent" ? (
          <motion.div
            key="sent"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="border-y border-[var(--line)] py-16"
            role="status"
          >
            <div aria-hidden className="mb-8 h-16 w-16 rounded-full" style={{ background: "radial-gradient(circle, #fff 0 18%, var(--color-spot) 19% 42%, transparent 43%)", boxShadow: "0 0 60px 16px rgb(255 197 110 / .3)" }} />
            <p className="h-section text-[clamp(1.8rem,3.4vw,3rem)]">Заявка отправлена</p>
            <p className="lead mt-4">Продюсер свяжется с вами в течение рабочего дня. Если вопрос срочный, позвоните нам.</p>
            <button type="button" className="btn btn-ghost mt-8" onClick={() => setState("idle")}>
              Отправить ещё одну
            </button>
          </motion.div>
        ) : (
          <motion.form key="form" onSubmit={onSubmit} noValidate initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-10">
            <fieldset>
              <legend className="meta mb-4">Что планируете</legend>
              <div className="flex flex-wrap gap-2">
                {TYPES.map((t) => (
                  <label key={t.value} className="cursor-pointer">
                    <input type="radio" name="type" value={t.value} checked={type === t.value} onChange={() => setType(t.value)} className="peer sr-only" />
                    <span className="inline-flex h-11 items-center rounded-full border border-[var(--line-strong)] px-4 text-sm transition-colors peer-checked:border-spot peer-checked:bg-spot peer-checked:text-black peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-spot hover:border-paper">
                      {t.label}
                    </span>
                  </label>
                ))}
              </div>
            </fieldset>

            <div className="grid gap-8 md:grid-cols-2">
              <label className="field">
                <span>Как к вам обращаться</span>
                <input name="name" className="input" autoComplete="name" required aria-invalid={!!errs.name} aria-describedby={errs.name ? "err-name" : undefined} />
                {err("name")}
              </label>
              <label className="field">
                <span>Компания</span>
                <input name="company" className="input" autoComplete="organization" />
              </label>
              <label className="field">
                <span>Почта</span>
                <input name="email" type="email" className="input" autoComplete="email" inputMode="email" required aria-invalid={!!errs.email} aria-describedby={errs.email ? "err-email" : undefined} />
                {err("email")}
              </label>
              <label className="field">
                <span>Телефон</span>
                <input name="phone" type="tel" className="input" autoComplete="tel" inputMode="tel" aria-invalid={!!errs.phone} />
                {err("phone")}
              </label>
              <label className="field">
                <span>Бюджет</span>
                <select name="budget" className="input" defaultValue="">
                  <option value="">Выберите вариант</option>
                  {BUDGETS.map((b) => (
                    <option key={b}>{b}</option>
                  ))}
                </select>
              </label>
              <label className="field">
                <span>Когда</span>
                <input name="eventDate" className="input" placeholder="Например, весна 2027" />
              </label>
            </div>
            <label className="field">
              <span>Расскажите о задаче</span>
              <textarea name="message" className="input" rows={4} required placeholder="Артист, город, формат, количество гостей" aria-invalid={!!errs.message} aria-describedby={errs.message ? "err-message" : undefined} />
              {err("message")}
            </label>
            {/* honeypot */}
            <input name="website" tabIndex={-1} autoComplete="off" className="absolute -left-[9999px] h-0 w-0 opacity-0" aria-hidden />

            <label className="flex items-start gap-3 text-sm text-dim">
              <input name="consent" type="checkbox" className="mt-1 h-4 w-4 accent-[var(--color-spot)]" required />
              <span>Соглашаюсь на обработку персональных данных для ответа на заявку</span>
            </label>
            {err("consent")}

            {error && (
              <p role="alert" className="rounded-md border border-danger/40 bg-danger/10 px-4 py-3 text-sm text-danger">
                {error}
              </p>
            )}

            <button type="submit" className="btn btn-light" disabled={state === "sending"}>
              {state === "sending" ? "Отправляем…" : "Отправить заявку"}
            </button>
          </motion.form>
        )}
      </AnimatePresence>
    </div>
  );
}

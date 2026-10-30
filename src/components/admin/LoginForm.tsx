"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { Logo } from "@/components/Logo";

export function LoginForm() {
  const router = useRouter();
  const sp = useSearchParams();
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: fd.get("email"), password: fd.get("password") }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(json.error ?? "Не удалось войти");
        return;
      }
      const next = sp.get("next");
      router.replace(next && next.startsWith("/admin") ? next : "/admin");
      router.refresh();
    } catch {
      setError("Нет связи с сервером");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="a-panel relative w-full max-w-sm p-8" noValidate>
      <Logo className="h-6 w-auto" />
      <h1 className="mt-8 font-display text-2xl font-light">Вход в админ-панель</h1>
      <div className="mt-8 space-y-5">
        <div>
          <label htmlFor="email" className="a-label">
            Почта
          </label>
          <input id="email" name="email" type="email" autoComplete="username" className="a-input" required autoFocus />
        </div>
        <div>
          <label htmlFor="password" className="a-label">
            Пароль
          </label>
          <input id="password" name="password" type="password" autoComplete="current-password" className="a-input" required />
        </div>
      </div>
      {error && (
        <p role="alert" className="mt-5 text-sm text-danger">
          {error}
        </p>
      )}
      <button type="submit" className="a-btn a-btn-primary mt-8 w-full !h-11" disabled={busy}>
        {busy ? "Проверяем…" : "Войти"}
      </button>
    </form>
  );
}

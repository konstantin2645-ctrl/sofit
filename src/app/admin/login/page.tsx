import { Suspense } from "react";
import { LoginForm } from "@/components/admin/LoginForm";

export const metadata = { title: "Вход" };

export default function LoginPage() {
  return (
    <main className="relative grid min-h-dvh place-items-center overflow-hidden px-4">
      <div
        aria-hidden
        className="absolute left-1/2 top-0 h-[110vh] w-[70vw] -translate-x-1/2"
        style={{ background: "conic-gradient(from 180deg at 50% 0%, transparent 166deg, rgb(255 197 110 / .14) 180deg, transparent 194deg)" }}
      />
      <Suspense>
        <LoginForm />
      </Suspense>
    </main>
  );
}

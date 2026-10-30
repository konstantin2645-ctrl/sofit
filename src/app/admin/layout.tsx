import type { Metadata } from "next";
import { Suspense } from "react";
import { AdminShell } from "@/components/admin/AdminShell";

export const metadata: Metadata = {
  title: { default: "Админ-панель", template: "%s — Админ-панель SOFIT" },
  robots: { index: false, follow: false },
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <Suspense fallback={<div className="min-h-dvh bg-[#070707]" />}>
      <AdminShell>{children}</AdminShell>
    </Suspense>
  );
}

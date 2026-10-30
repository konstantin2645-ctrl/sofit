import { Suspense } from "react";
import { Leads } from "@/components/admin/Leads";

export const metadata = { title: "Заявки" };

export default function Page() {
  return (
    <Suspense fallback={<p className="text-dim">Загружаем…</p>}>
      <Leads />
    </Suspense>
  );
}

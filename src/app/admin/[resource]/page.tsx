import { Suspense } from "react";
import { notFound } from "next/navigation";
import { ResourceList } from "@/components/admin/ResourceViews";

const ALLOWED = ["events", "artists", "venues", "projects"];

export function generateStaticParams() {
  return ALLOWED.map((resource) => ({ resource }));
}

async function View({ params }: { params: PageProps<"/admin/[resource]">["params"] }) {
  const { resource } = await params;
  if (!ALLOWED.includes(resource)) notFound();
  return <ResourceList resource={resource} />;
}

export default function Page(props: PageProps<"/admin/[resource]">) {
  return (
    <Suspense fallback={<p className="text-dim">Загружаем…</p>}>
      <View params={props.params} />
    </Suspense>
  );
}

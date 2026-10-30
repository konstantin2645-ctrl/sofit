import { Suspense } from "react";
import { notFound } from "next/navigation";
import { ResourceEditor } from "@/components/admin/ResourceViews";

const ALLOWED = ["events", "artists", "venues", "projects"];

export function generateStaticParams() {
  return ALLOWED.map((resource) => ({ resource, id: "new" }));
}

async function View({ params }: { params: PageProps<"/admin/[resource]/[id]">["params"] }) {
  const { resource, id } = await params;
  if (!ALLOWED.includes(resource) || !(id === "new" || /^\d+$/.test(id))) notFound();
  return <ResourceEditor key={`${resource}-${id}`} resource={resource} id={id} />;
}

export default function Page(props: PageProps<"/admin/[resource]/[id]">) {
  return (
    <Suspense fallback={<p className="text-dim">Загружаем…</p>}>
      <View params={props.params} />
    </Suspense>
  );
}

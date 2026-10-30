import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { Gallery } from "@/components/portfolio/Gallery";
import { getProjectBySlug, getProjects } from "@/lib/data";
import { GEL_COLORS } from "@/lib/format";

export async function generateStaticParams() {
  const projects = await getProjects();
  return projects.length ? projects.map((p) => ({ slug: p.slug })) : [{ slug: "__placeholder" }];
}

export async function generateMetadata({ params }: PageProps<"/portfolio/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const p = await getProjectBySlug(slug);
  if (!p) return { title: "Проект не найден" };
  return {
    title: p.title,
    description: p.summary,
    alternates: { canonical: `/portfolio/${p.slug}` },
    openGraph: { title: p.title, description: p.summary, images: p.cover ? [{ url: p.cover }] : undefined },
  };
}

async function ProjectContent({ params }: { params: PageProps<"/portfolio/[slug]">["params"] }) {
  const { slug } = await params;
  const [p, all] = await Promise.all([getProjectBySlug(slug), getProjects()]);
  if (!p) notFound();
  const i = all.findIndex((x) => x.id === p.id);
  const next = all[(i + 1) % all.length];

  return (
    <article style={{ "--gel": GEL_COLORS[p.gel] } as React.CSSProperties}>
      <section className="relative flex min-h-[88svh] items-end overflow-hidden">
        {p.cover && <Image src={p.cover} alt="" fill priority sizes="100vw" className="object-cover" />}
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-black/10" />
        <div className="wrap relative pb-14 pt-40">
          <nav aria-label="Хлебные крошки" className="meta mb-6">
            <Link href="/portfolio" className="link-underline">
              Проекты
            </Link>
            <span aria-hidden> / </span>
            {p.category}
          </nav>
          <h1 className="display max-w-[16ch] text-[clamp(2.6rem,7vw,7rem)]">{p.title}</h1>
          <dl className="mt-10 grid grid-cols-2 gap-6 border-t border-[var(--line-strong)] pt-6 md:grid-cols-4">
            {[
              ["Клиент", p.client],
              ["Год", String(p.year)],
              ["География", p.city],
              ["Формат", p.category],
            ].map(([k, v]) => (
              <div key={k}>
                <dt className="meta">{k}</dt>
                <dd className="mt-1">{v}</dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      <section className="wrap grid gap-14 py-24 lg:grid-cols-12">
        <div className="lg:col-span-7">
          <p className="font-display text-[clamp(1.4rem,2.6vw,2.2rem)] font-light leading-snug tracking-tight">{p.summary}</p>
          <div className="prose-stage lead mt-10">
            {p.body.split(/\n{2,}/).map((t, k) => (
              <p key={k}>{t}</p>
            ))}
          </div>
        </div>
        {p.stats.length > 0 && (
          <dl className="space-y-8 lg:col-span-4 lg:col-start-9">
            {p.stats.map((s) => (
              <div key={s.label} className="border-t border-[var(--line)] pt-5">
                <dd className="display text-[clamp(2.4rem,4.4vw,4rem)]" style={{ color: "var(--gel)" }}>
                  {s.value}
                </dd>
                <dt className="mt-2 text-dim">{s.label}</dt>
              </div>
            ))}
          </dl>
        )}
      </section>

      {p.media.length > 0 && (
        <section className="wrap pb-24" aria-label="Фото и видео">
          <Gallery items={p.media} title={p.title} />
        </section>
      )}

      {next && next.id !== p.id && (
        <Link href={`/portfolio/${next.slug}`} className="group relative block overflow-hidden border-t border-[var(--line)]">
          {next.cover && (
            <Image src={next.cover} alt="" fill sizes="100vw" className="object-cover opacity-30 transition-all duration-1000 group-hover:scale-105 group-hover:opacity-60" />
          )}
          <div className="wrap relative py-28 md:py-40">
            <p className="meta">Следующий проект</p>
            <p className="display mt-4 text-[clamp(2.2rem,6vw,6rem)] transition-colors group-hover:text-spot">{next.title}</p>
          </div>
        </Link>
      )}
    </article>
  );
}

export default function ProjectPage(props: PageProps<"/portfolio/[slug]">) {
  return (
    <Suspense fallback={<div className="min-h-[88svh] animate-pulse bg-stage" />}>
      <ProjectContent params={props.params} />
    </Suspense>
  );
}

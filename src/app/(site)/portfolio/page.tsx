import type { Metadata } from "next";
import { PortfolioGrid } from "@/components/portfolio/PortfolioGrid";
import { getProjects } from "@/lib/data";
import { GEL_COLORS } from "@/lib/format";

export const metadata: Metadata = {
  title: "Портфолио: реализованные проекты",
  description: "Фестивали, туры по аренам, корпоративные шоу и концертные программы, которые спродюсировал SOFIT. Фото, видео и цифры.",
  alternates: { canonical: "/portfolio" },
};

export default async function PortfolioPage() {
  const projects = await getProjects();
  return (
    <div className="wrap pb-28 pt-32 md:pt-44">
      <header className="mb-14 grid gap-6 lg:grid-cols-12 lg:items-end">
        <h1 className="display text-[clamp(3.2rem,10vw,9.5rem)] lg:col-span-7">Проекты</h1>
        <p className="lead lg:col-span-5">Каждый проект — от первой встречи до последнего аплодисмента. Цифры, фото и видео без ретуши.</p>
      </header>
      <PortfolioGrid
        items={projects.map((p) => ({
          slug: p.slug,
          title: p.title,
          category: p.category,
          year: p.year,
          city: p.city,
          summary: p.summary,
          cover: p.cover,
          gel: GEL_COLORS[p.gel],
          hasVideo: p.media.some((m) => m.type === "video"),
        }))}
      />
    </div>
  );
}

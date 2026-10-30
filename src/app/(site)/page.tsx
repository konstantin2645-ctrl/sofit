import Image from "next/image";
import Link from "next/link";
import { Hero } from "@/components/home/Hero";
import { LightField } from "@/components/home/LightField";
import { Manifesto } from "@/components/home/Manifesto";
import { Programme } from "@/components/home/Programme";
import { ProjectsRail } from "@/components/home/ProjectsRail";
import { getContent, getProjects, getUpcomingEvents } from "@/lib/data";
import { GEL_COLORS, pluralRu, zoned } from "@/lib/format";
import { toProgrammeRow } from "@/lib/view";

export default async function HomePage() {
  const [content, events, projects] = await Promise.all([getContent(), getUpcomingEvents(), getProjects()]);
  const next = events.find((e) => e.featured && e.status === "published") ?? events[0];
  const nz = next ? zoned(next.startsAt, next.venue?.timezone) : null;
  const rows = events.slice(0, 6).map(toProgrammeRow);
  const { hero, about, services, partners, contacts } = content;

  return (
    <>
      <Hero
        hero={hero}
        next={
          next && nz
            ? {
                slug: next.slug,
                title: next.title,
                date: `${nz.day} ${nz.monthGen}`,
                place: next.venue?.city ?? "",
                gel: GEL_COLORS[next.gel],
              }
            : null
        }
      />

      {/* Afisha */}
      <section className="wrap py-24 md:py-36" aria-labelledby="afisha-title">
        <div className="mb-10 flex flex-wrap items-end justify-between gap-6 md:mb-14">
          <h2 id="afisha-title" className="h-section">
            Ближайшие концерты
          </h2>
          <Link href="/concerts" className="btn btn-ghost">
            Вся афиша, {events.length} {pluralRu(events.length, "событие", "события", "событий")}
          </Link>
        </div>
        {rows.length ? (
          <Programme rows={rows} />
        ) : (
          <p className="lead">Новые даты появятся совсем скоро. Подпишитесь на наш Telegram, чтобы узнать первыми.</p>
        )}
      </section>

      {/* About */}
      <section className="relative border-t border-[var(--line)]" aria-labelledby="about-title">
        <div className="wrap grid gap-12 py-24 md:py-36 lg:grid-cols-12">
          <div className="lg:col-span-7">
            <h2 id="about-title" className="meta mb-8">
              О компании
            </h2>
            <Manifesto text={about.manifesto} />
            <p className="lead mt-12">{about.text}</p>
          </div>
          <div className="relative min-h-[360px] lg:col-span-5 lg:min-h-0">
            <LightField className="absolute inset-0 cursor-crosshair lg:-right-[var(--gutter)]" />
            <p className="meta absolute bottom-0 left-0 max-w-[16rem]">
              Наш световой парк — 600+ приборов. Проведите курсором по сцене или нажмите.
            </p>
          </div>
        </div>
        <div className="wrap pb-24 md:pb-36">
          <dl className="grid grid-cols-2 border-t border-[var(--line)] lg:grid-cols-4">
            {about.stats.map((s, i) => (
              <div
                key={s.label}
                className={`border-b border-[var(--line)] py-8 pr-6 lg:border-b-0 ${i % 2 === 1 ? "pl-6 lg:pl-0" : ""} ${
                  i > 0 ? "lg:border-l lg:pl-8" : ""
                } ${i % 2 === 1 ? "border-l lg:border-l" : ""}`}
              >
                <dt className="sr-only">{s.label}</dt>
                <dd>
                  <span className="display block whitespace-nowrap text-[clamp(2rem,4vw,3.75rem)] tabular-nums">{s.value}</span>
                  <span className="mt-3 block max-w-[14rem] text-dim">{s.label}</span>
                </dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      {/* Projects */}
      <div className="border-t border-[var(--line)]">
        <ProjectsRail
          heading={
            <>
              <h2 id="projects-title" className="h-section">
                Наши проекты
              </h2>
              <p className="lead mt-6 max-w-md">Туры, фестивали и частные шоу, которые мы придумали и провели от первой встречи до последнего аплодисмента.</p>
              <Link href="/portfolio" className="btn btn-ghost mt-8 self-start">
                Все проекты
              </Link>
            </>
          }
          projects={projects.slice(0, 6).map((p) => ({
            slug: p.slug,
            title: p.title,
            category: p.category,
            year: p.year,
            city: p.city,
            cover: p.cover,
            gel: GEL_COLORS[p.gel],
            stat: p.stats[0],
          }))}
        />
      </div>

      {/* Services */}
      <section className="wrap border-t border-[var(--line)] py-24 md:py-36" aria-labelledby="services-title">
        <div className="grid gap-10 lg:grid-cols-12">
          <div className="lg:col-span-4">
            <h2 id="services-title" className="h-section">
              Что мы делаем
            </h2>
            <p className="lead mt-6">Можно заказать событие целиком или подключить нас на отдельный участок работы.</p>
          </div>
          <ul className="lg:col-span-8">
            {services.map((s) => (
              <li key={s.slug} className="border-b border-[var(--line)] first:border-t">
                <Link href={`/services#${s.slug}`} className="group grid grid-cols-[1fr_auto] items-center gap-6 py-7">
                  <span>
                    <span className="h-card block transition-colors group-hover:text-spot">{s.title}</span>
                    <span className="mt-2 block max-w-xl text-dim">{s.lead}</span>
                  </span>
                  <span className="relative hidden aspect-square w-24 overflow-hidden rounded-full sm:block">
                    <Image
                      src={s.image}
                      alt=""
                      fill
                      sizes="96px"
                      className="scale-125 object-cover opacity-40 grayscale transition-all duration-700 group-hover:scale-100 group-hover:opacity-100 group-hover:grayscale-0"
                    />
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Partners */}
      <section className="overflow-hidden border-t border-[var(--line)] py-20" aria-labelledby="partners-title">
        <h2 id="partners-title" className="wrap meta mb-10">
          Партнёры, с которыми мы работаем годами
        </h2>
        <div className="marquee" style={{ "--marquee-speed": "55s" } as React.CSSProperties}>
          {[0, 1].map((k) => (
            <ul key={k} className="flex shrink-0 items-center" aria-hidden={k === 1}>
              {partners.map((p, i) => (
                <li key={p.name + k} className="flex items-center gap-10 pr-10">
                  <span className="whitespace-nowrap">
                    <span
                      className={`block text-[clamp(1.6rem,3vw,2.6rem)] leading-none ${
                        i % 3 === 0 ? "font-display font-light tracking-tight" : i % 3 === 1 ? "font-sans font-bold tracking-tight" : "font-display font-medium uppercase tracking-[0.06em]"
                      }`}
                    >
                      {p.name}
                    </span>
                    <span className="meta mt-2 block">{p.kind}</span>
                  </span>
                  <span aria-hidden className="h-2 w-2 rounded-full bg-spot/60" />
                </li>
              ))}
            </ul>
          ))}
        </div>
      </section>

      {/* Contacts */}
      <section className="wrap border-t border-[var(--line)] py-24 md:py-32" aria-labelledby="contacts-title">
        <div className="grid gap-12 lg:grid-cols-12">
          <h2 id="contacts-title" className="h-section lg:col-span-5">
            Контакты
          </h2>
          <div className="space-y-8 lg:col-span-7">
            <div className="grid gap-8 sm:grid-cols-2">
              <div>
                <p className="meta">Телефон</p>
                <a href={`tel:${contacts.phone.replace(/[^\d+]/g, "")}`} className="h-card link-underline mt-2 inline-block">
                  {contacts.phone}
                </a>
              </div>
              <div>
                <p className="meta">Почта для сотрудничества</p>
                <a href={`mailto:${contacts.email}`} className="h-card link-underline mt-2 inline-block">
                  {contacts.email}
                </a>
              </div>
              <div>
                <p className="meta">Офис</p>
                <p className="mt-2 text-paper/90">{contacts.address}</p>
                <p className="text-dim">{contacts.hours}</p>
              </div>
              <div>
                <p className="meta">Соцсети</p>
                <ul className="mt-2 flex flex-wrap gap-x-5 gap-y-1">
                  {contacts.socials.map((s) => (
                    <li key={s.name}>
                      <a className="link-underline" href={s.url} target="_blank" rel="noopener noreferrer">
                        {s.name}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
            <Link href="/contacts" className="btn btn-ghost">
              Карта и форма заявки
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}

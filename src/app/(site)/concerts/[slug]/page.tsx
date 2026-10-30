import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense, ViewTransition } from "react";
import { EventCard } from "@/components/concerts/EventCard";
import { EventActions } from "@/components/event/EventActions";
import { TicketPanel } from "@/components/event/TicketPanel";
import { StickyBuy } from "@/components/event/StickyBuy";
import { VenueMap } from "@/components/event/VenueMap";
import { getEventBySlug, getEventSlugs, getUpcomingEvents } from "@/lib/data";
import { currencyFor, formatDateLong, GEL_COLORS, zoned } from "@/lib/format";
import { SITE_URL } from "@/lib/site";

const SITE = SITE_URL;

export async function generateStaticParams() {
  const slugs = await getEventSlugs();
  return slugs.length ? slugs.map((slug) => ({ slug })) : [{ slug: "__placeholder" }];
}

export async function generateMetadata({ params }: PageProps<"/concerts/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const e = await getEventBySlug(slug);
  if (!e) return { title: "Концерт не найден" };
  const z = zoned(e.startsAt, e.venue?.timezone);
  const description = `${e.title}: ${e.subtitle}. ${z.day} ${z.monthGen}, ${e.venue?.city ?? ""}, ${e.venue?.name ?? ""}. Билеты онлайн.`;
  return {
    title: `${e.title} — ${z.day} ${z.monthGen}, ${e.venue?.city ?? ""}`,
    description,
    alternates: { canonical: `/concerts/${e.slug}` },
    openGraph: { title: e.title, description, images: e.cover ? [{ url: e.cover, width: 1600, height: 1067 }] : undefined, type: "article" },
  };
}

async function EventContent({ params }: { params: PageProps<"/concerts/[slug]">["params"] }) {
  const { slug } = await params;
  const e = await getEventBySlug(slug);
  if (!e) notFound();
  const tz = e.venue?.timezone;
  const z = zoned(e.startsAt, tz);
  const doors = e.doorsAt ? zoned(e.doorsAt, tz).time : null;
  const currency = currencyFor(e.venue?.country);
  const gel = GEL_COLORS[e.gel];
  const upcoming = await getUpcomingEvents();
  const related = upcoming
    .filter((x) => x.id !== e.id && (x.artistId === e.artistId || x.genre === e.genre || x.venue?.city === e.venue?.city))
    .slice(0, 3);
  const end = new Date(new Date(e.startsAt).getTime() + 2.5 * 3600 * 1000).toISOString();
  const minPrice = e.tiers.length ? Math.min(...e.tiers.map((t) => t.price)) : 0;

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "MusicEvent",
    name: e.title,
    description: e.subtitle,
    startDate: new Date(e.startsAt).toISOString(),
    endDate: end,
    eventStatus: e.status === "cancelled" ? "https://schema.org/EventCancelled" : "https://schema.org/EventScheduled",
    eventAttendanceMode: "https://schema.org/OfflineEventAttendanceMode",
    image: e.cover ? [new URL(e.cover, SITE).toString()] : undefined,
    location: e.venue && {
      "@type": "Place",
      name: e.venue.name,
      address: { "@type": "PostalAddress", streetAddress: e.venue.address, addressLocality: e.venue.city, addressCountry: e.venue.country },
    },
    performer: e.artist ? { "@type": "MusicGroup", name: e.artist.name } : undefined,
    organizer: { "@type": "Organization", name: "SOFIT", url: SITE },
    offers: e.tiers.map((t) => ({
      "@type": "Offer",
      name: t.name,
      price: t.price,
      priceCurrency: currency === "₽" ? "RUB" : currency === "₸" ? "KZT" : currency === "AED" ? "AED" : "AMD",
      availability: t.sold >= t.total || e.status === "sold_out" ? "https://schema.org/SoldOut" : "https://schema.org/InStock",
      url: `${SITE}/concerts/${e.slug}`,
    })),
  };

  return (
    <article style={{ "--gel": gel } as React.CSSProperties}>
      {/* Hero */}
      <section className="relative flex min-h-[92svh] items-end overflow-hidden">
        {e.cover && (
          <ViewTransition name={`event-cover-${e.slug}`}>
            <Image src={e.cover} alt="" fill priority sizes="100vw" className="object-cover" />
          </ViewTransition>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/55 to-black/20" />
        <div
          aria-hidden
          className="absolute inset-0 mix-blend-screen"
          style={{ background: "radial-gradient(60% 50% at 70% 20%, color-mix(in oklab, var(--gel) 30%, transparent), transparent 70%)" }}
        />
        <div aria-hidden className="grain pointer-events-none absolute inset-0 overflow-hidden" />
        <div className="wrap relative pb-12 pt-40 md:pb-16">
          <nav aria-label="Хлебные крошки" className="meta mb-6">
            <Link href="/concerts" className="link-underline">
              Афиша
            </Link>
            <span aria-hidden> / </span>
            <span>{e.genre}</span>
          </nav>
          <p className="mb-5 flex items-center gap-3 text-paper/85">
            <span className="gel-dot" />
            {e.status === "sold_out" ? "Все билеты проданы" : e.status === "cancelled" ? "Концерт отменён" : `${e.ageLimit}+`}
          </p>
          <h1 className="display max-w-[14ch] text-[clamp(3rem,9vw,8.5rem)]">{e.title}</h1>
          <p className="lead mt-6">{e.subtitle}</p>
          <div className="mt-10 grid gap-8 border-t border-[var(--line-strong)] pt-8 md:grid-cols-[auto_auto_1fr] md:gap-14">
            <div>
              <p className="meta">Когда</p>
              <p className="h-card mt-1">
                {z.day} {z.monthGen}, {z.time}
              </p>
              <p className="text-sm text-dim">
                {z.weekday}, {z.year}
                {doors ? `, вход с ${doors}` : ""}
              </p>
            </div>
            <div>
              <p className="meta">Где</p>
              <p className="h-card mt-1">{e.venue?.name ?? "Площадка уточняется"}</p>
              <p className="text-sm text-dim">
                {e.venue?.city}
                {e.venue?.address ? `, ${e.venue.address}` : ""}
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-3 md:justify-end">
              {e.status === "published" && (
                <a href="#tickets" className="btn btn-light">
                  Билеты от {new Intl.NumberFormat("ru-RU").format(minPrice)} {currency}
                </a>
              )}
              <EventActions
                title={e.title}
                start={new Date(e.startsAt).toISOString()}
                end={end}
                location={`${e.venue?.name ?? ""}, ${e.venue?.address ?? ""}, ${e.venue?.city ?? ""}`}
                url={`${SITE}/concerts/${e.slug}`}
              />
            </div>
          </div>
        </div>
      </section>

      {/* About + facts */}
      <section className="wrap grid gap-14 py-24 lg:grid-cols-12">
        <div className="lg:col-span-7">
          <h2 className="h-section mb-8">О концерте</h2>
          <div className="prose-stage lead">
            {e.description.split(/\n{2,}/).map((p, i) => (
              <p key={i}>{p}</p>
            ))}
          </div>
          {e.artist && (
            <div className="mt-14 flex items-center gap-6 border-t border-[var(--line)] pt-10">
              {e.artist.image && (
                <div className="relative h-28 w-24 shrink-0 overflow-hidden rounded-sm">
                  <Image src={e.artist.image} alt={e.artist.name} fill sizes="96px" className="object-cover" />
                </div>
              )}
              <div>
                <p className="meta">Артист</p>
                <p className="h-card mt-1">{e.artist.name}</p>
                <p className="text-sm text-dim">
                  {e.artist.genre}, {e.artist.country}
                </p>
                <Link href={`/concerts?artist=${e.artist.slug}`} className="link-underline mt-2 inline-block text-sm">
                  Все концерты артиста
                </Link>
              </div>
            </div>
          )}
        </div>
        <aside className="lg:col-span-4 lg:col-start-9">
          <dl className="divide-y divide-[var(--line)] border-y border-[var(--line)]">
            {[
              ["Дата", formatDateLong(e.startsAt, tz)],
              ["Начало", z.time + (doors ? `, вход с ${doors}` : "")],
              ["Площадка", e.venue?.name ?? "—"],
              ["Вместимость", e.venue?.capacity ? `${new Intl.NumberFormat("ru-RU").format(e.venue.capacity)} мест` : "—"],
              ["Жанр", e.genre],
              ["Возраст", `${e.ageLimit}+`],
            ].map(([k, v]) => (
              <div key={k} className="flex justify-between gap-6 py-4">
                <dt className="text-dim">{k}</dt>
                <dd className="text-right">{v}</dd>
              </div>
            ))}
            {e.lineup.length > 0 && (
              <div className="py-4">
                <dt className="text-dim">Также выступят</dt>
                <dd className="mt-2 flex flex-wrap gap-2">
                  {e.lineup.map((l) => (
                    <span key={l} className="rounded-full border border-[var(--line-strong)] px-3 py-1 text-sm">
                      {l}
                    </span>
                  ))}
                </dd>
              </div>
            )}
          </dl>
        </aside>
      </section>

      {/* Tickets */}
      {e.tiers.length > 0 && (
        <section className="wrap border-t border-[var(--line)] py-24" aria-labelledby="tickets-title">
          <div className="mb-10 flex flex-wrap items-end justify-between gap-4">
            <h2 id="tickets-title" className="h-section">
              Билеты
            </h2>
            <p className="meta max-w-sm">В цену уже включены все сервисные сборы.</p>
          </div>
          <TicketPanel
            eventId={e.id}
            title={e.title}
            dateLabel={`${z.day} ${z.monthGen}, ${z.time}`}
            place={`${e.venue?.name ?? ""}, ${e.venue?.city ?? ""}`}
            currency={currency}
            status={e.status}
            ticketUrl={e.ticketUrl}
            tiers={e.tiers.map((t) => ({ name: t.name, price: t.price, total: t.total, left: Math.max(0, t.total - t.sold), note: t.note }))}
          />
        </section>
      )}

      {/* Gallery */}
      {e.gallery.length > 0 && (
        <section className="border-t border-[var(--line)] py-24" aria-label="Фотографии">
          <div className="no-scrollbar flex snap-x snap-mandatory gap-4 overflow-x-auto px-[var(--gutter)]">
            {e.gallery.map((m, i) => (
              <div key={i} className="relative aspect-[3/2] w-[78vw] shrink-0 snap-start overflow-hidden rounded-sm md:w-[42vw]">
                {m.type === "video" ? (
                  <video src={m.src} poster={m.poster} controls playsInline className="h-full w-full object-cover" />
                ) : (
                  <Image src={m.src} alt={m.caption ?? `${e.title}, фото ${i + 1}`} fill sizes="(min-width:768px) 42vw, 78vw" className="object-cover" />
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Venue */}
      {e.venue && (
        <section className="wrap grid gap-10 border-t border-[var(--line)] py-24 lg:grid-cols-12" aria-labelledby="venue-title">
          <div className="lg:col-span-4">
            <h2 id="venue-title" className="h-section">
              Как добраться
            </h2>
            <p className="h-card mt-8">{e.venue.name}</p>
            <p className="mt-2 text-dim">
              {e.venue.address}, {e.venue.city}
            </p>
            <p className="mt-6 text-paper/80">{e.venue.description}</p>
          </div>
          {e.venue.lat != null && e.venue.lng != null && (
            <VenueMap lat={e.venue.lat} lng={e.venue.lng} label={e.venue.name} className="h-[420px] lg:col-span-8 lg:h-[520px]" />
          )}
        </section>
      )}

      {related.length > 0 && (
        <section className="wrap border-t border-[var(--line)] py-24" aria-labelledby="related-title">
          <h2 id="related-title" className="h-section mb-12">
            Вам может понравиться
          </h2>
          <div className="grid gap-x-6 gap-y-14 sm:grid-cols-2 xl:grid-cols-3">
            {related.map((r) => (
              <EventCard key={r.id} e={r} />
            ))}
          </div>
        </section>
      )}

      {e.status === "published" && e.tiers.length > 0 && (
        <StickyBuy label={`${z.day} ${z.monthGen}, ${e.venue?.city ?? ""}`} price={`${new Intl.NumberFormat("ru-RU").format(minPrice)} ${currency}`} />
      )}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }} />
    </article>
  );
}

export default function EventPage(props: PageProps<"/concerts/[slug]">) {
  return (
    <Suspense fallback={<div className="min-h-[92svh] animate-pulse bg-stage" />}>
      <EventContent params={props.params} />
    </Suspense>
  );
}

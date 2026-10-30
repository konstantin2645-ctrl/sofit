import type { Metadata } from "next";
import Link from "next/link";
import { LightField } from "@/components/home/LightField";
import { ServicesScrolly } from "@/components/site/ServicesScrolly";
import { getContent } from "@/lib/data";

export const metadata: Metadata = {
  title: "Услуги: организация концертов и фестивалей",
  description:
    "Организация концертов и фестивалей под ключ, букинг и работа с артистами, корпоративные мероприятия, техническое производство и продвижение.",
  alternates: { canonical: "/services" },
};

const PROCESS = [
  ["Бриф", "Встречаемся, уточняем цели, аудиторию, даты и бюджет. Через 48 часов присылаем первые идеи."],
  ["Концепция и смета", "Предлагаем площадки, артистов, техническое решение и прозрачную смету без скрытых строк."],
  ["Подготовка", "Договоры, райдеры, продакшн, билеты и продвижение. Вы видите статус каждой задачи онлайн."],
  ["Шоу", "Монтаж, саундчек, режиссура вечера и безопасность. Продюсер проекта на площадке с первого часа."],
  ["Отчёт", "Продажи, отзывы, фото и видео. Разбираем, что можно сделать ещё лучше в следующий раз."],
];

export default async function ServicesPage() {
  const { services } = await getContent();
  return (
    <>
      <section className="relative overflow-hidden pt-32 md:pt-44">
        <LightField className="absolute inset-0 opacity-70" />
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-black/30 via-transparent to-black" />
        <div className="wrap pointer-events-none relative pb-24 md:pb-36">
          <h1 className="display max-w-[12ch] text-[clamp(3.2rem,10vw,9.5rem)]">Услуги</h1>
          <p className="lead mt-8">
            Берём на себя всё, что стоит между идеей и полным залом. Пять направлений, одна команда и один продюсер, который отвечает за результат.
          </p>
          <div className="pointer-events-auto mt-10 flex flex-wrap gap-3">
            {services.map((s) => (
              <a key={s.slug} href={`#${s.slug}`} className="btn btn-ghost !h-11 text-sm">
                {s.title}
              </a>
            ))}
          </div>
        </div>
      </section>

      <div className="wrap pb-24">
        <ServicesScrolly services={services} />
      </div>

      <section className="wrap border-t border-[var(--line)] py-24 md:py-32" aria-labelledby="process-title">
        <h2 id="process-title" className="h-section mb-14">
          Как мы работаем
        </h2>
        <ol className="grid gap-px overflow-hidden rounded-sm border border-[var(--line)] bg-[var(--line)] md:grid-cols-5">
          {PROCESS.map(([t, d], i) => (
            <li key={t} className="bg-black p-6 md:min-h-[18rem]">
              <span className="display text-4xl text-spot tabular-nums">{i + 1}</span>
              <h3 lang="ru" className="h-card mt-8 [hyphens:auto]">{t}</h3>
              <p className="mt-3 text-sm text-dim">{d}</p>
            </li>
          ))}
        </ol>
      </section>

      <section className="wrap border-t border-[var(--line)] py-24 md:py-32">
        <div className="grid items-end gap-10 lg:grid-cols-12">
          <p className="h-section lg:col-span-8">Расскажите о задаче — ответим в течение рабочего дня</p>
          <div className="lg:col-span-4 lg:justify-self-end">
            <Link href="/contacts#form" className="btn btn-light">
              Оставить заявку
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}

import type { Metadata } from "next";
import { LeadForm } from "@/components/contacts/LeadForm";
import { VenueMap } from "@/components/event/VenueMap";
import { getContent } from "@/lib/data";

export const metadata: Metadata = {
  title: "Контакты и сотрудничество",
  description: "Обсудить концерт, тур, фестиваль или корпоративное событие с SOFIT. Телефон, почта, адрес офиса в Москве и форма заявки.",
  alternates: { canonical: "/contacts" },
};

export default async function ContactsPage() {
  const { contacts } = await getContent();
  const tel = contacts.phone.replace(/[^\d+]/g, "");
  return (
    <>
      <div className="wrap pt-32 md:pt-44">
        <h1 className="display text-[clamp(3.2rem,10vw,9.5rem)]">Контакты</h1>
        <div className="mt-14 grid gap-10 border-t border-[var(--line)] pt-10 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <p className="meta">Телефон</p>
            <a href={`tel:${tel}`} className="h-card link-underline mt-2 inline-block">
              {contacts.phone}
            </a>
            <p className="mt-1 text-sm text-dim">{contacts.hours}</p>
          </div>
          <div>
            <p className="meta">Сотрудничество</p>
            <a href={`mailto:${contacts.email}`} className="h-card link-underline mt-2 inline-block">
              {contacts.email}
            </a>
          </div>
          <div>
            <p className="meta">Пресса и аккредитация</p>
            <a href={`mailto:${contacts.pressEmail}`} className="h-card link-underline mt-2 inline-block">
              {contacts.pressEmail}
            </a>
          </div>
          <div>
            <p className="meta">Соцсети</p>
            <ul className="mt-2 space-y-1">
              {contacts.socials.map((s) => (
                <li key={s.name}>
                  <a href={s.url} target="_blank" rel="noopener noreferrer" className="link-underline">
                    {s.name}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      <section id="form" className="wrap scroll-mt-24 py-24 md:py-32" aria-labelledby="form-title">
        <div className="grid gap-14 lg:grid-cols-12">
          <div className="lg:col-span-4">
            <h2 id="form-title" className="h-section">
              Форма сотрудничества
            </h2>
            <p className="lead mt-6">Опишите задачу в свободной форме. Ответим в течение рабочего дня и предложим время для звонка.</p>
          </div>
          <div className="lg:col-span-7 lg:col-start-6">
            <LeadForm />
          </div>
        </div>
      </section>

      <section className="wrap pb-24" aria-labelledby="office-title">
        <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
          <h2 id="office-title" className="h-section">
            Офис
          </h2>
          <p className="text-paper/85">{contacts.address}</p>
        </div>
        <VenueMap lat={contacts.lat} lng={contacts.lng} label={`SOFIT, ${contacts.address}`} zoom={15} className="h-[60svh] min-h-[360px]" />
      </section>
    </>
  );
}

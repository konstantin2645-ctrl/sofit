import Link from "next/link";
import { Logo } from "@/components/Logo";
import type { ContactsContent } from "@/lib/content";
import { cacheLife } from "next/cache";

async function CopyrightYear() {
  "use cache";
  cacheLife("days");
  return <>{new Date().getFullYear()}</>;
}

export function Footer({ contacts }: { contacts: ContactsContent }) {
  return (
    <footer className="relative overflow-hidden border-t border-[var(--line)] pt-20 pb-10">
      <div className="wrap">
        <div className="grid gap-12 md:grid-cols-12">
          <div className="md:col-span-6">
            <p className="h-section max-w-[14ch]">Есть артист, площадка или идея?</p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/contacts#form" className="btn btn-light">
                Обсудить проект
              </Link>
              <a href={`mailto:${contacts.email}`} className="btn btn-ghost">
                {contacts.email}
              </a>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-8 text-[0.95rem] md:col-span-6 md:grid-cols-3">
            <div>
              <h2 className="meta mb-3">Разделы</h2>
              <ul className="space-y-2">
                <li><Link className="link-underline" href="/concerts">Афиша</Link></li>
                <li><Link className="link-underline" href="/services">Услуги</Link></li>
                <li><Link className="link-underline" href="/portfolio">Проекты</Link></li>
                <li><Link className="link-underline" href="/contacts">Контакты</Link></li>
                <li><Link className="link-underline text-dim" href="/admin">Вход для команды</Link></li>
              </ul>
            </div>
            <div>
              <h2 className="meta mb-3">Соцсети</h2>
              <ul className="space-y-2">
                {contacts.socials.map((s) => (
                  <li key={s.name}>
                    <a className="link-underline" href={s.url} target="_blank" rel="noopener noreferrer">
                      {s.name}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
            <div className="col-span-2 md:col-span-1">
              <h2 className="meta mb-3">Офис</h2>
              <address className="not-italic text-paper/85">
                {contacts.address}
                <br />
                <a className="link-underline" href={`tel:${contacts.phone.replace(/[^\d+]/g, "")}`}>
                  {contacts.phone}
                </a>
                <br />
                <span className="text-dim">{contacts.hours}</span>
              </address>
            </div>
          </div>
        </div>

        <Logo className="mt-24 w-full text-paper/[0.07]" title="SOFIT" />

        <div className="mt-8 flex flex-col justify-between gap-3 text-sm text-mute md:flex-row">
          <p>© 2009–<CopyrightYear /> ООО «Софит Лайв». Все права защищены.</p>
          <p>
            Пресса: <a className="link-underline text-dim" href={`mailto:${contacts.pressEmail}`}>{contacts.pressEmail}</a>
          </p>
        </div>
      </div>
    </footer>
  );
}

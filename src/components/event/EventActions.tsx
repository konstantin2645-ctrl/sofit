"use client";

import { useState } from "react";

/** Add-to-calendar (.ics) and share buttons. */
export function EventActions({ title, start, end, location, url }: { title: string; start: string; end: string; location: string; url: string }) {
  const [copied, setCopied] = useState(false);

  const ics = () => {
    const f = (d: string) => new Date(d).toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
    const esc = (s: string) => s.replace(/[\\,;]/g, (m) => "\\" + m).replace(/\n/g, "\\n");
    const body = [
      "BEGIN:VCALENDAR",
      "VERSION:2.0",
      "PRODID:-//SOFIT//Afisha//RU",
      "BEGIN:VEVENT",
      `UID:${f(start)}-${encodeURIComponent(title)}@sofit.live`,
      `DTSTAMP:${f(new Date().toISOString())}`,
      `DTSTART:${f(start)}`,
      `DTEND:${f(end)}`,
      `SUMMARY:${esc(title)}`,
      `LOCATION:${esc(location)}`,
      `URL:${url}`,
      "END:VEVENT",
      "END:VCALENDAR",
    ].join("\r\n");
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([body], { type: "text/calendar;charset=utf-8" }));
    a.download = "sofit-event.ics";
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  };

  const share = async () => {
    const href = window.location.href;
    if (navigator.share) {
      try {
        await navigator.share({ title, url: href });
        return;
      } catch {
        /* cancelled */
      }
    }
    await navigator.clipboard?.writeText(href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex flex-wrap gap-3">
      <button type="button" onClick={ics} className="btn btn-ghost">
        В календарь
      </button>
      <button type="button" onClick={share} className="btn btn-ghost" aria-live="polite">
        {copied ? "Ссылка скопирована" : "Поделиться"}
      </button>
    </div>
  );
}

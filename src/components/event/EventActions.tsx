"use client";

import { useState } from "react";

/** Add-to-calendar (.ics) and share buttons. */
export function EventActions({ title, start, end, location, url }: { title: string; start: string; end: string; location: string; url: string }) {
  const [copied, setCopied] = useState(false);

  // Google Calendar template link: works everywhere without downloading files.
  const f = (d: string) => new Date(d).toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
  const calendarUrl =
    "https://calendar.google.com/calendar/render?action=TEMPLATE" +
    `&text=${encodeURIComponent(title)}&dates=${f(start)}/${f(end)}` +
    `&location=${encodeURIComponent(location)}&details=${encodeURIComponent(url)}`;

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
    try {
      await navigator.clipboard?.writeText(href);
    } catch {
      return;
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex flex-wrap gap-3">
      <a href={calendarUrl} target="_blank" rel="noopener noreferrer" className="btn btn-ghost">
        В календарь
      </a>
      <button type="button" onClick={share} className="btn btn-ghost" aria-live="polite">
        {copied ? "Ссылка скопирована" : "Поделиться"}
      </button>
    </div>
  );
}

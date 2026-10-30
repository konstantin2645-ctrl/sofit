import type { Metadata, Viewport } from "next";
import "./globals.css";

const site = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(site),
  title: {
    default: "SOFIT — концертное агентство полного цикла",
    template: "%s — SOFIT",
  },
  description:
    "Концерты, туры и фестивали в России и за рубежом. Организация мероприятий под ключ, работа с артистами, техническое производство и продвижение.",
  applicationName: "SOFIT",
  keywords: ["концерты", "афиша", "билеты", "организация концертов", "фестивали", "концертное агентство", "корпоративные мероприятия"],
  openGraph: {
    type: "website",
    locale: "ru_RU",
    siteName: "SOFIT",
    images: [{ url: "/media/og.jpg", width: 1200, height: 630, alt: "SOFIT — концертное агентство" }],
  },
  twitter: { card: "summary_large_image" },
  icons: { icon: "/icon.svg" },
  alternates: { canonical: "/" },
};

export const viewport: Viewport = {
  themeColor: "#000000",
  colorScheme: "dark",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ru">
      <head>
        <link rel="preload" href="/fonts/unbounded-cyrillic-wght-normal.woff2" as="font" type="font/woff2" crossOrigin="" />
        <link rel="preload" href="/fonts/golos-text-cyrillic-wght-normal.woff2" as="font" type="font/woff2" crossOrigin="" />
      </head>
      <body>{children}</body>
    </html>
  );
}

import { Header } from "@/components/site/Header";
import { Footer } from "@/components/site/Footer";
import { SmoothScroll } from "@/components/site/SmoothScroll";
import { getContent } from "@/lib/data";
import { Suspense } from "react";
import { SITE_URL } from "@/lib/site";

export default async function SiteLayout({ children }: { children: React.ReactNode }) {
  const content = await getContent();
  const org = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "SOFIT",
    legalName: "ООО «Софит Лайв»",
    url: SITE_URL,
    logo: "/icon.svg",
    email: content.contacts.email,
    telephone: content.contacts.phone,
    address: { "@type": "PostalAddress", streetAddress: content.contacts.address, addressLocality: content.contacts.city, addressCountry: "RU" },
    sameAs: content.contacts.socials.map((s) => s.url),
  };
  return (
    <>
      <Suspense>
        <SmoothScroll />
      </Suspense>
      <Header phone={content.contacts.phone} email={content.contacts.email} />
      <main id="main">{children}</main>
      <Footer contacts={content.contacts} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(org).replace(/</g, "\\u003c") }} />
    </>
  );
}

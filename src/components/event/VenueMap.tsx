"use client";

import { useEffect, useRef } from "react";
import "leaflet/dist/leaflet.css";

/** Dark interactive map with a glowing pin. Tiles: CARTO dark (OpenStreetMap data). */
export function VenueMap({ lat, lng, label, zoom = 15, className = "" }: { lat: number; lng: number; label: string; zoom?: number; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let map: import("leaflet").Map | undefined;
    let cancelled = false;
    (async () => {
      const L = (await import("leaflet")).default;
      if (cancelled || !ref.current) return;
      map = L.map(ref.current, { center: [lat, lng], zoom, scrollWheelZoom: false, zoomControl: true, attributionControl: true });
      L.tileLayer("https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png", {
        subdomains: "abcd",
        maxZoom: 19,
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>',
      }).addTo(map);
      const icon = L.divIcon({ className: "", html: '<div class="sofit-pin"></div>', iconSize: [22, 22], iconAnchor: [11, 11] });
      L.marker([lat, lng], { icon, title: label, alt: label }).addTo(map).bindPopup(label);
      // enable wheel zoom only after the user clicks into the map
      map.once("focus", () => map?.scrollWheelZoom.enable());
    })();
    return () => {
      cancelled = true;
      map?.remove();
    };
  }, [lat, lng, label, zoom]);

  return (
    <div className={`relative overflow-hidden rounded-sm border border-[var(--line)] ${className}`}>
      <div ref={ref} className="absolute inset-0" role="region" aria-label={`Карта: ${label}`} data-lenis-prevent />
      <a
        href={`https://yandex.ru/maps/?pt=${lng},${lat}&z=16&l=map`}
        target="_blank"
        rel="noopener noreferrer"
        className="btn btn-light absolute bottom-4 left-4 z-[500] !h-10 !px-4 text-sm"
      >
        Построить маршрут
      </a>
    </div>
  );
}

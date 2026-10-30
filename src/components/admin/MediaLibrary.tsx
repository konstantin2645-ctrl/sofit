"use client";

import { useState } from "react";
import { PageHead } from "./AdminShell";
import { api } from "./client";
import { kb, Thumb, Uploader, useMedia, type MediaRow } from "./Media";
import { useToast } from "./Toast";

export function MediaLibrary() {
  const { items, loading, setItems } = useMedia();
  const [filter, setFilter] = useState<"all" | "image" | "video">("all");
  const [active, setActive] = useState<MediaRow | null>(null);
  const toast = useToast();
  const list = items.filter((m) => filter === "all" || m.mime.startsWith(filter));

  const remove = async (m: MediaRow) => {
    if (!confirm(`Удалить «${m.filename}»? Если файл используется на сайте, там останется пустое место.`)) return;
    try {
      await api(`/api/admin/media/${m.id}`, { method: "DELETE" });
      setItems((x) => x.filter((i) => i.id !== m.id));
      setActive(null);
      toast("Файл удалён");
    } catch (e) {
      toast((e as Error).message, "error");
    }
  };

  const copy = async (url: string) => {
    await navigator.clipboard?.writeText(new URL(url, window.location.origin).toString());
    toast("Ссылка скопирована");
  };

  return (
    <>
      <PageHead title="Медиатека" sub="Фото и видео для афиши, портфолио и страниц сайта" />
      <Uploader onDone={(rows) => setItems((x) => [...rows, ...x])} />
      <div className="my-6 flex gap-2" role="group" aria-label="Тип файлов">
        {(
          [
            ["all", "Все"],
            ["image", "Фото"],
            ["video", "Видео"],
          ] as const
        ).map(([v, l]) => (
          <button key={v} type="button" aria-pressed={filter === v} onClick={() => setFilter(v)} className={`a-btn !h-9 ${filter === v ? "a-btn-primary" : ""}`}>
            {l}
          </button>
        ))}
        <span className="ml-auto self-center text-sm text-dim">{list.length} файлов</span>
      </div>
      {loading ? (
        <p className="text-dim">Загружаем…</p>
      ) : (
        <ul className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
          {list.map((m) => (
            <li key={m.id} className="a-panel overflow-hidden">
              <button type="button" onClick={() => setActive(m)} className="block aspect-[4/3] w-full overflow-hidden bg-black" aria-label={`Подробнее: ${m.filename}`}>
                <Thumb m={m} />
              </button>
              <div className="p-3">
                <p className="truncate text-sm" title={m.filename}>
                  {m.filename}
                </p>
                <p className="text-xs text-dim">
                  {m.width ? `${m.width}×${m.height}, ` : ""}
                  {kb(m.size)}
                </p>
              </div>
            </li>
          ))}
        </ul>
      )}

      {active && (
        <div className="fixed inset-0 z-[80] grid place-items-center bg-black/80 p-4" onMouseDown={(e) => e.target === e.currentTarget && setActive(null)}>
          <div role="dialog" aria-modal="true" aria-label={active.filename} className="a-panel w-full max-w-3xl overflow-hidden">
            <div className="aspect-video bg-black">
              {active.mime.startsWith("video/") ? (
                <video src={active.url} controls className="h-full w-full object-contain" />
              ) : (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={active.url} alt="" className="h-full w-full object-contain" />
              )}
            </div>
            <div className="flex flex-wrap items-center gap-3 p-4">
              <div className="mr-auto min-w-0">
                <p className="truncate">{active.filename}</p>
                <p className="truncate text-xs text-dim">{active.url}</p>
              </div>
              <button type="button" className="a-btn" onClick={() => copy(active.url)}>
                Скопировать ссылку
              </button>
              <button type="button" className="a-btn a-btn-danger" onClick={() => remove(active)}>
                Удалить
              </button>
              <button type="button" className="a-btn" onClick={() => setActive(null)} autoFocus>
                Закрыть
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

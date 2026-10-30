"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { api } from "./client";
import { useToast } from "./Toast";

export type MediaRow = { id: number; url: string; filename: string; mime: string; size: number; width: number | null; height: number | null; alt: string; createdAt: string };

const kb = (n: number) => (n > 1024 * 1024 ? `${(n / 1024 / 1024).toFixed(1)} МБ` : `${Math.round(n / 1024)} КБ`);

export function useMedia() {
  const [items, setItems] = useState<MediaRow[]>([]);
  const [loading, setLoading] = useState(true);
  const load = useCallback(async () => {
    try {
      const r = await api<{ data: MediaRow[] }>("/api/admin/media");
      setItems(r.data);
    } finally {
      setLoading(false);
    }
  }, []);
  useEffect(() => {
    let alive = true;
    api<{ data: MediaRow[] }>("/api/admin/media")
      .then((r) => alive && setItems(r.data))
      .catch(() => {})
      .finally(() => alive && setLoading(false));
    return () => {
      alive = false;
    };
  }, []);
  return { items, loading, load, setItems };
}

/** Drag-and-drop uploader with progress. */
export function Uploader({ onDone, accept = "image/*,video/mp4,video/webm" }: { onDone: (rows: MediaRow[]) => void; accept?: string }) {
  const input = useRef<HTMLInputElement>(null);
  const [drag, setDrag] = useState(false);
  const [progress, setProgress] = useState<number | null>(null);
  const toast = useToast();

  const upload = (files: FileList | File[]) => {
    const list = Array.from(files);
    if (!list.length) return;
    const fd = new FormData();
    list.forEach((f) => fd.append("file", f));
    const xhr = new XMLHttpRequest();
    xhr.open("POST", "/api/admin/media");
    xhr.upload.onprogress = (e) => e.lengthComputable && setProgress(Math.round((e.loaded / e.total) * 100));
    xhr.onload = () => {
      setProgress(null);
      let body: { data?: MediaRow[]; error?: string } = {};
      try {
        body = JSON.parse(xhr.responseText);
      } catch {}
      if (xhr.status >= 200 && xhr.status < 300 && body.data) {
        toast(list.length > 1 ? `Загружено файлов: ${list.length}` : "Файл загружен");
        onDone(body.data);
      } else toast(body.error ?? "Не удалось загрузить файл", "error");
    };
    xhr.onerror = () => {
      setProgress(null);
      toast("Сеть недоступна, загрузка прервана", "error");
    };
    xhr.send(fd);
  };

  return (
    <div
      onDragOver={(e) => {
        e.preventDefault();
        setDrag(true);
      }}
      onDragLeave={() => setDrag(false)}
      onDrop={(e) => {
        e.preventDefault();
        setDrag(false);
        upload(e.dataTransfer.files);
      }}
      className={`relative grid place-items-center rounded-xl border border-dashed px-6 py-8 text-center transition-colors ${
        drag ? "border-spot bg-spot/5" : "border-[var(--line-strong)]"
      }`}
    >
      <input ref={input} type="file" multiple accept={accept} className="sr-only" onChange={(e) => e.target.files && upload(e.target.files)} />
      {progress === null ? (
        <>
          <p className="text-sm text-dim">Перетащите файлы сюда или</p>
          <button type="button" className="a-btn mt-3" onClick={() => input.current?.click()}>
            Выбрать на компьютере
          </button>
          <p className="mt-3 text-xs text-mute">JPG, PNG, WebP, AVIF, GIF до 15 МБ; MP4, WebM до 200 МБ</p>
        </>
      ) : (
        <div className="w-full max-w-xs">
          <p className="text-sm">Загрузка… {progress}%</p>
          <div className="mt-2 h-1 rounded bg-white/10">
            <div className="h-1 rounded bg-spot transition-[width]" style={{ width: `${progress}%` }} />
          </div>
        </div>
      )}
    </div>
  );
}

export function Thumb({ m, className = "" }: { m: Pick<MediaRow, "url" | "mime">; className?: string }) {
  return m.mime.startsWith("video/") ? (
    <video src={m.url} muted playsInline preload="metadata" className={`h-full w-full object-cover ${className}`} />
  ) : (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={m.url} alt="" loading="lazy" className={`h-full w-full object-cover ${className}`} />
  );
}

/** Modal library: pick one (or several) files, or upload new ones. */
export function MediaPicker({
  open,
  onClose,
  onPick,
  multiple = false,
  kind = "image",
}: {
  open: boolean;
  onClose: () => void;
  onPick: (rows: MediaRow[]) => void;
  multiple?: boolean;
  kind?: "image" | "any";
}) {
  const { items, loading, setItems } = useMedia();
  const [sel, setSel] = useState<number[]>([]);
  const [q, setQ] = useState("");
  const [wasOpen, setWasOpen] = useState(open);
  if (wasOpen !== open) {
    setWasOpen(open);
    if (open) setSel([]);
  }
  const list = items.filter((m) => (kind === "image" ? m.mime.startsWith("image/") : true)).filter((m) => !q || m.filename.toLowerCase().includes(q.toLowerCase()));

  const toggle = (id: number) => {
    if (!multiple) {
      const row = items.find((m) => m.id === id);
      if (row) onPick([row]);
      onClose();
      return;
    }
    setSel((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]));
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/80 p-4" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label="Медиатека"
            className="a-panel flex max-h-[88dvh] w-full max-w-5xl flex-col overflow-hidden"
            initial={{ y: 30, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 20, opacity: 0 }}
          >
            <div className="flex flex-wrap items-center gap-3 border-b border-[var(--line)] p-4">
              <h2 className="font-display text-xl font-light">Медиатека</h2>
              <input className="a-input ml-auto !h-10 max-w-xs" placeholder="Поиск по имени файла" value={q} onChange={(e) => setQ(e.target.value)} />
              <button type="button" className="a-btn" onClick={onClose}>
                Закрыть
              </button>
            </div>
            <div className="overflow-y-auto p-4">
              <Uploader onDone={(rows) => setItems((x) => [...rows, ...x])} accept={kind === "image" ? "image/*" : undefined} />
              {loading ? (
                <p className="py-10 text-center text-dim">Загружаем медиатеку…</p>
              ) : (
                <ul className="mt-4 grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-6">
                  {list.map((m) => {
                    const on = sel.includes(m.id);
                    return (
                      <li key={m.id}>
                        <button
                          type="button"
                          onClick={() => toggle(m.id)}
                          className={`relative block aspect-square w-full overflow-hidden rounded-lg border-2 ${on ? "border-spot" : "border-transparent hover:border-white/30"}`}
                          title={m.filename}
                        >
                          <Thumb m={m} />
                          {on && <span className="absolute right-1.5 top-1.5 grid h-6 w-6 place-items-center rounded-full bg-spot text-xs font-bold text-black">{sel.indexOf(m.id) + 1}</span>}
                          {m.mime.startsWith("video/") && <span className="badge absolute bottom-1.5 left-1.5 bg-black/70">видео</span>}
                        </button>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
            {multiple && (
              <div className="flex items-center justify-between border-t border-[var(--line)] p-4">
                <span className="text-sm text-dim">Выбрано: {sel.length}</span>
                <button
                  type="button"
                  className="a-btn a-btn-primary"
                  disabled={!sel.length}
                  onClick={() => {
                    onPick(sel.map((id) => items.find((m) => m.id === id)!).filter(Boolean));
                    onClose();
                  }}
                >
                  Добавить выбранные
                </button>
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export { kb };

import "server-only";
import { mkdir, readFile, stat, unlink, writeFile } from "node:fs/promises";
import path from "node:path";
import { eq } from "drizzle-orm";
import { db, schema as s } from "@/db";

/** "disk" (default) keeps files in UPLOAD_DIR; "db" stores them in Postgres for hosts without a persistent disk. */
export const STORAGE_DRIVER = process.env.STORAGE_DRIVER === "db" ? "db" : "disk";
export const UPLOAD_DIR = path.resolve(/* turbopackIgnore: true */ process.cwd(), process.env.UPLOAD_DIR || "./storage/uploads");

const MB = 1024 * 1024;
export const ALLOWED: Record<string, { ext: string; max: number }> = {
  "image/jpeg": { ext: "jpg", max: 15 * MB },
  "image/png": { ext: "png", max: 15 * MB },
  "image/webp": { ext: "webp", max: 15 * MB },
  "image/avif": { ext: "avif", max: 15 * MB },
  "image/gif": { ext: "gif", max: 15 * MB },
  "video/mp4": { ext: "mp4", max: STORAGE_DRIVER === "db" ? 50 * MB : 200 * MB },
  "video/webm": { ext: "webm", max: STORAGE_DRIVER === "db" ? 50 * MB : 200 * MB },
};

export const MIME_BY_EXT: Record<string, string> = Object.fromEntries(Object.entries(ALLOWED).map(([mime, { ext }]) => [ext, mime]));

const safe = (segments: string[]) => segments.length > 0 && segments.every((x) => /^[a-zA-Z0-9._-]+$/.test(x) && !x.startsWith("."));

/** Resolves a public /uploads/... path to an absolute file path, refusing traversal. */
export function resolveUpload(segments: string[]) {
  if (!safe(segments)) return null;
  const abs = path.resolve(/* turbopackIgnore: true */ UPLOAD_DIR, ...segments);
  return abs.startsWith(UPLOAD_DIR + path.sep) ? abs : null;
}

/** Saves a file and returns its public URL (/uploads/...). */
export async function saveUpload(segments: string[], buf: Buffer, mime: string) {
  if (!safe(segments)) throw new Error("bad path");
  const rel = segments.join("/");
  if (STORAGE_DRIVER === "db") {
    await db.insert(s.mediaBlobs).values({ path: rel, mime, data: buf });
  } else {
    const abs = resolveUpload(segments)!;
    await mkdir(/* turbopackIgnore: true */ path.dirname(abs), { recursive: true });
    await writeFile(/* turbopackIgnore: true */ abs, buf);
  }
  return `/uploads/${rel}`;
}

export async function readUpload(segments: string[]): Promise<{ data: Buffer; mime: string } | null> {
  const ext = segments.at(-1)?.split(".").pop()?.toLowerCase() ?? "";
  const mime = MIME_BY_EXT[ext];
  if (!safe(segments) || !mime) return null;
  if (STORAGE_DRIVER === "db") {
    const [row] = await db.select().from(s.mediaBlobs).where(eq(s.mediaBlobs.path, segments.join("/"))).limit(1);
    return row ? { data: row.data, mime: row.mime } : null;
  }
  const abs = resolveUpload(segments);
  if (!abs) return null;
  try {
    if (!(await stat(/* turbopackIgnore: true */ abs)).isFile()) return null;
    return { data: await readFile(/* turbopackIgnore: true */ abs), mime };
  } catch {
    return null;
  }
}

export async function deleteUpload(url: string) {
  if (!url.startsWith("/uploads/")) return; // bundled /media files are never deleted
  const segments = url.slice("/uploads/".length).split("/");
  if (!safe(segments)) return;
  if (STORAGE_DRIVER === "db") await db.delete(s.mediaBlobs).where(eq(s.mediaBlobs.path, segments.join("/")));
  else {
    const abs = resolveUpload(segments);
    if (abs) await unlink(/* turbopackIgnore: true */ abs).catch(() => {});
  }
}

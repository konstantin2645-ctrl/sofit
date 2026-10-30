import "server-only";
import path from "node:path";

export const UPLOAD_DIR = path.resolve(/* turbopackIgnore: true */ process.cwd(), process.env.UPLOAD_DIR || "./storage/uploads");

export const ALLOWED: Record<string, { ext: string; max: number }> = {
  "image/jpeg": { ext: "jpg", max: 15 * 1024 * 1024 },
  "image/png": { ext: "png", max: 15 * 1024 * 1024 },
  "image/webp": { ext: "webp", max: 15 * 1024 * 1024 },
  "image/avif": { ext: "avif", max: 15 * 1024 * 1024 },
  "image/gif": { ext: "gif", max: 15 * 1024 * 1024 },
  "video/mp4": { ext: "mp4", max: 200 * 1024 * 1024 },
  "video/webm": { ext: "webm", max: 200 * 1024 * 1024 },
};

export const MIME_BY_EXT: Record<string, string> = Object.fromEntries(
  Object.entries(ALLOWED).map(([mime, { ext }]) => [ext, mime]),
);

/** Resolves a public /uploads/... path to an absolute file path, refusing traversal. */
export function resolveUpload(segments: string[]) {
  if (segments.some((s) => !/^[a-zA-Z0-9._-]+$/.test(s) || s.startsWith("."))) return null;
  const abs = path.resolve(UPLOAD_DIR, ...segments);
  return abs.startsWith(UPLOAD_DIR + path.sep) ? abs : null;
}

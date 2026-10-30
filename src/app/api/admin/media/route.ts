import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import type { NextRequest } from "next/server";
import { desc } from "drizzle-orm";
import sharp from "sharp";
import { db, schema as s } from "@/db";
import { handle, HttpError, json, requireAdmin } from "@/lib/api";
import { ALLOWED, UPLOAD_DIR } from "@/lib/storage";

export const GET = handle(async (req: NextRequest) => {
  await requireAdmin(req);
  const rows = await db.select().from(s.media).orderBy(desc(s.media.createdAt));
  return json({ data: rows });
});

export const POST = handle(async (req: NextRequest) => {
  await requireAdmin(req);
  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    throw new HttpError(400, "Ожидается multipart/form-data");
  }
  const files = form.getAll("file").filter((f): f is File => f instanceof File);
  if (!files.length) throw new HttpError(400, "Файл не выбран");
  const alt = String(form.get("alt") ?? "").slice(0, 200);
  const saved = [];
  for (const file of files) {
    const rule = ALLOWED[file.type];
    if (!rule) throw new HttpError(415, `Формат ${file.type || "файла"} не поддерживается. Можно JPG, PNG, WebP, AVIF, GIF, MP4, WebM.`);
    if (file.size > rule.max) throw new HttpError(413, `Файл «${file.name}» больше ${Math.round(rule.max / 1024 / 1024)} МБ`);
    const buf = Buffer.from(await file.arrayBuffer());
    let width: number | null = null;
    let height: number | null = null;
    if (file.type.startsWith("image/")) {
      try {
        const meta = await sharp(buf).metadata();
        width = meta.width ?? null;
        height = meta.height ?? null;
      } catch {
        throw new HttpError(415, `Файл «${file.name}» повреждён или не является изображением`);
      }
    }
    const now = new Date();
    const dir = [String(now.getFullYear()), String(now.getMonth() + 1).padStart(2, "0")];
    const name = `${crypto.randomUUID().slice(0, 12)}.${rule.ext}`;
    await mkdir(path.join(/* turbopackIgnore: true */ UPLOAD_DIR, ...dir), { recursive: true });
    await writeFile(path.join(/* turbopackIgnore: true */ UPLOAD_DIR, ...dir, name), buf);
    const [row] = await db
      .insert(s.media)
      .values({ url: `/uploads/${dir.join("/")}/${name}`, filename: file.name.slice(0, 200), mime: file.type, size: file.size, width, height, alt })
      .returning();
    saved.push(row);
  }
  return json({ data: saved }, 201);
});

import type { NextRequest } from "next/server";
import { readUpload } from "@/lib/storage";

export async function GET(req: NextRequest, ctx: { params: Promise<{ path: string[] }> }) {
  const { path: segments } = await ctx.params;
  const file = await readUpload(segments);
  if (!file) return new Response("Not found", { status: 404 });
  const size = file.data.length;
  const headers: Record<string, string> = {
    "Content-Type": file.mime,
    "Cache-Control": "public, max-age=31536000, immutable",
    "Accept-Ranges": "bytes",
    "X-Content-Type-Options": "nosniff",
  };
  // Range requests let browsers (Safari especially) seek in videos.
  const m = req.headers.get("range")?.match(/^bytes=(\d*)-(\d*)$/);
  if (m) {
    let start = m[1] ? Number(m[1]) : size - Number(m[2]);
    let end = m[1] && m[2] ? Number(m[2]) : size - 1;
    start = Math.max(0, start);
    end = Math.min(size - 1, end);
    if (start > end) return new Response(null, { status: 416, headers: { "Content-Range": `bytes */${size}` } });
    return new Response(new Uint8Array(file.data.subarray(start, end + 1)), {
      status: 206,
      headers: { ...headers, "Content-Range": `bytes ${start}-${end}/${size}`, "Content-Length": String(end - start + 1) },
    });
  }
  return new Response(new Uint8Array(file.data), { headers: { ...headers, "Content-Length": String(size) } });
}

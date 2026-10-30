import "server-only";
import type { NextRequest } from "next/server";
import { asc, desc, eq, getTableColumns, type AnyColumn } from "drizzle-orm";
import type { PgTable } from "drizzle-orm/pg-core";
import type { ZodType } from "zod";
import { db } from "@/db";
import { bust, handle, HttpError, json, parseBody, requireAdmin } from "@/lib/api";

type Ctx = { params: Promise<{ id: string }> };

/** Builds REST handlers (collection + item) for a simple admin-managed table. */
export function crud<T extends PgTable>(opts: {
  table: T;
  input: ZodType<Record<string, unknown>>;
  tags: string[];
  orderBy?: { column: AnyColumn; dir?: "asc" | "desc" }[];
}) {
  const { table, input, tags } = opts;
  const cols = getTableColumns(table) as Record<string, AnyColumn>;
  const idCol = cols.id;
  const order = (opts.orderBy ?? [{ column: idCol, dir: "desc" as const }]).map((o) =>
    o.dir === "asc" ? asc(o.column) : desc(o.column),
  );

  const parseId = async (ctx: Ctx) => {
    const id = Number((await ctx.params).id);
    if (!Number.isInteger(id) || id <= 0) throw new HttpError(400, "Некорректный идентификатор");
    return id;
  };

  return {
    collection: {
      GET: handle(async (req: NextRequest) => {
        await requireAdmin(req);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const rows = await (db.select().from(table as any) as any).orderBy(...order);
        return json({ data: rows });
      }),
      POST: handle(async (req: NextRequest) => {
        await requireAdmin(req);
        const data = await parseBody(req, input);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const [row] = await db.insert(table).values(data as any).returning();
        bust(...tags);
        return json({ data: row }, 201);
      }),
    },
    item: {
      GET: handle(async (req: NextRequest, ctx: Ctx) => {
        await requireAdmin(req);
        const id = await parseId(ctx);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const rows = await (db.select().from(table as any) as any).where(eq(idCol, id)).limit(1);
        if (!rows.length) throw new HttpError(404, "Запись не найдена");
        return json({ data: rows[0] });
      }),
      PUT: handle(async (req: NextRequest, ctx: Ctx) => {
        await requireAdmin(req);
        const id = await parseId(ctx);
        const data = await parseBody(req, input);
        const values = { ...data, ...("updatedAt" in cols ? { updatedAt: new Date() } : {}) };
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const rows = await db.update(table).set(values as any).where(eq(idCol, id)).returning();
        if (!(rows as unknown[]).length) throw new HttpError(404, "Запись не найдена");
        bust(...tags);
        return json({ data: (rows as unknown[])[0] });
      }),
      DELETE: handle(async (req: NextRequest, ctx: Ctx) => {
        await requireAdmin(req);
        const id = await parseId(ctx);
        const rows = await db.delete(table).where(eq(idCol, id)).returning();
        if (!(rows as unknown[]).length) throw new HttpError(404, "Запись не найдена");
        bust(...tags);
        return json({ ok: true });
      }),
    },
  };
}

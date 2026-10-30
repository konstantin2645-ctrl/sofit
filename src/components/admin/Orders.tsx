"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { PageHead } from "./AdminShell";
import { api } from "./client";
import { useToast } from "./Toast";

type Order = {
  id: number; code: string; eventId: number; eventTitle: string | null; eventSlug: string | null; startsAt: string | null;
  tier: string; quantity: number; amount: number; name: string; email: string; phone: string; status: "reserved" | "paid" | "cancelled"; createdAt: string;
};

const STATUS: Record<Order["status"], string> = { reserved: "Бронь", paid: "Оплачен", cancelled: "Отменён" };
const nf = new Intl.NumberFormat("ru-RU");
const when = (d: string) => new Intl.DateTimeFormat("ru-RU", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }).format(new Date(d));

export function Orders() {
  const toast = useToast();
  const [rows, setRows] = useState<Order[] | null>(null);
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("");

  useEffect(() => {
    api<{ data: Order[] }>("/api/admin/orders").then((r) => setRows(r.data)).catch((e) => toast(e.message, "error"));
  }, [toast]);

  const list = useMemo(() => {
    const n = q.toLowerCase();
    return (rows ?? []).filter((o) => (!status || o.status === status) && (!n || [o.code, o.name, o.email, o.eventTitle].join(" ").toLowerCase().includes(n)));
  }, [rows, q, status]);

  const setOrderStatus = async (o: Order, s: Order["status"]) => {
    try {
      const r = await api<{ data: Order }>(`/api/admin/orders/${o.id}`, { method: "PATCH", json: { status: s } });
      setRows((x) => x?.map((y) => (y.id === o.id ? { ...y, ...r.data } : y)) ?? null);
      toast(s === "cancelled" ? "Заказ отменён, места вернулись в продажу" : `Статус: ${STATUS[s]}`);
    } catch (e) {
      toast((e as Error).message, "error");
    }
  };

  const exportCsv = () => {
    const head = ["Код", "Концерт", "Категория", "Кол-во", "Сумма", "Имя", "Почта", "Телефон", "Статус", "Создан"];
    const lines = list.map((o) => [o.code, o.eventTitle ?? "", o.tier, o.quantity, o.amount, o.name, o.email, o.phone, STATUS[o.status], new Date(o.createdAt).toISOString()]);
    const csv = [head, ...lines].map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(";")).join("\n");
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8" }));
    a.download = `sofit-orders-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
  };

  const total = list.filter((o) => o.status !== "cancelled").reduce((a, o) => a + o.amount, 0);

  return (
    <>
      <PageHead
        title="Заказы билетов"
        sub={rows ? `${list.length} заказов на ${nf.format(total)} ₽ (без отменённых)` : "Покупки с сайта"}
        actions={
          <button type="button" className="a-btn" onClick={exportCsv} disabled={!list.length}>
            Выгрузить в CSV
          </button>
        }
      />
      <div className="mb-4 flex flex-wrap gap-2">
        <select className="a-input !h-10 max-w-[12rem]" value={status} onChange={(e) => setStatus(e.target.value)} aria-label="Статус заказа">
          <option value="">Все статусы</option>
          {Object.entries(STATUS).map(([v, l]) => (
            <option key={v} value={v}>
              {l}
            </option>
          ))}
        </select>
        <input className="a-input !h-10 max-w-sm" placeholder="Код, имя, почта или концерт" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Поиск по заказам" />
      </div>
      <div className="a-panel overflow-x-auto">
        {!rows ? (
          <p className="p-8 text-dim">Загружаем…</p>
        ) : !list.length ? (
          <p className="p-10 text-center text-dim">Заказов пока нет. Они появятся, когда зрители купят билеты на сайте.</p>
        ) : (
          <table className="a-table">
            <thead>
              <tr>
                <th>Код</th>
                <th>Концерт</th>
                <th>Билеты</th>
                <th>Сумма</th>
                <th>Покупатель</th>
                <th>Создан</th>
                <th>Статус</th>
              </tr>
            </thead>
            <tbody>
              {list.map((o) => (
                <tr key={o.id}>
                  <td className="font-mono text-xs">{o.code}</td>
                  <td className="max-w-[16rem]">
                    <Link href={`/admin/events/${o.eventId}`} className="block truncate hover:text-spot">
                      {o.eventTitle ?? "—"}
                    </Link>
                    {o.startsAt && <span className="text-xs text-dim">{when(o.startsAt)}</span>}
                  </td>
                  <td className="whitespace-nowrap">
                    {o.tier} × {o.quantity}
                  </td>
                  <td className="whitespace-nowrap tabular-nums">{nf.format(o.amount)}</td>
                  <td>
                    <span className="block">{o.name}</span>
                    <a href={`mailto:${o.email}`} className="text-xs text-dim hover:text-paper">
                      {o.email}
                    </a>
                  </td>
                  <td className="whitespace-nowrap text-sm text-dim">{when(o.createdAt)}</td>
                  <td>
                    <select className="a-input !h-9 !w-auto" value={o.status} onChange={(e) => setOrderStatus(o, e.target.value as Order["status"])} aria-label={`Статус заказа ${o.code}`}>
                      {Object.entries(STATUS).map(([v, l]) => (
                        <option key={v} value={v}>
                          {l}
                        </option>
                      ))}
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </>
  );
}

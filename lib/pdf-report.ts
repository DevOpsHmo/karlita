import { PDFDocument, StandardFonts, rgb, type PDFFont } from "pdf-lib";
import { kindFor, type ChartKind, type ChartPrefs } from "./chart-prefs";
import type { ChartBar, ChartCard } from "./item-stats";
import { supabaseAdmin } from "./supabase/admin";

const HEX = {
  yes: rgb(0.416, 0.035, 0.22),
  no: rgb(0.71, 0.32, 0.23),
  gold: rgb(0.77, 0.64, 0.35),
  green: rgb(0.416, 0.035, 0.22),
};

const PAGE_W = 612;
const PAGE_H = 792;
const TOP = 750;
const BOTTOM = 52;
const MAX_W = 500;

function colorOf(bar: ChartBar) {
  return HEX[bar.color ?? "green"];
}

export async function buildStatsPdf(
  title: string,
  subtitle: string,
  carpetas: ChartCard[],
  acomp: ChartCard[],
  prefs?: ChartPrefs
) {
  const doc = await PDFDocument.create();
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const bold = await doc.embedFont(StandardFonts.HelveticaBold);
  const ctx = { page: doc.addPage([PAGE_W, PAGE_H]), y: TOP };
  const resolved: ChartPrefs = prefs ?? { defaultKind: "bars", byId: {} };

  const newPage = () => {
    ctx.page = doc.addPage([PAGE_W, PAGE_H]);
    ctx.y = TOP;
  };

  const ensure = (need: number) => {
    if (ctx.y - need < BOTTOM) newPage();
  };

  const wrap = (value: string, size: number, f: PDFFont) => {
    const words = value.split(/\s+/);
    const lines: string[] = [];
    let line = "";
    for (const w of words) {
      const test = line ? `${line} ${w}` : w;
      if (f.widthOfTextAtSize(test, size) > MAX_W) {
        if (line) lines.push(line);
        line = w;
      } else line = test;
    }
    if (line) lines.push(line);
    return lines.length ? lines : [value];
  };

  const write = (value: string, size: number, f: PDFFont, color = rgb(0.416, 0.035, 0.22), indent = 50) => {
    for (const line of wrap(value, size, f)) {
      ensure(size + 8);
      ctx.page.drawText(line, { x: indent, y: ctx.y, size, font: f, color });
      ctx.y -= size + 6;
    }
  };

  const setH = (bars: ChartBar[], kind: ChartKind, heading?: string) => {
    let h = heading ? 16 : 0;
    if (kind === "pie") h += 90 + bars.length * 16;
    else if (kind === "table") h += 16 + bars.length * 16;
    else h += bars.length * 24;
    return h;
  };

  const cardH = (card: ChartCard) => {
    if (card.kind === "text") return 22 + wrap(card.title, 10, bold).length * 16 + (card.texts ?? []).length * 16;
    const kind = kindFor(resolved, card.id);
    let h = wrap(`${card.title}`, 10, bold).length * 16 + 8;
    for (const g of card.groups ?? []) h += setH(g.bars, kind, g.name);
    if (card.bars) h += setH(card.bars, kind);
    h += (card.texts ?? []).length * 16;
    return h + 10;
  };

  const drawBars = (bars: ChartBar[]) => {
    const total = bars.reduce((a, b) => a + b.count, 0) || 1;
    for (const bar of bars) {
      const pct = bar.count / total;
      write(`${bar.label}: ${bar.count} (${Math.round(pct * 100)}%)`, 9, font, rgb(0.2, 0.2, 0.2), 58);
      ensure(14);
      ctx.page.drawRectangle({ x: 58, y: ctx.y, width: 400, height: 6, color: rgb(0.91, 0.88, 0.82) });
      ctx.page.drawRectangle({ x: 58, y: ctx.y, width: Math.max(2, 400 * pct), height: 6, color: colorOf(bar) });
      ctx.y -= 12;
    }
  };

  const drawTable = (bars: ChartBar[]) => {
    const total = bars.reduce((a, b) => a + b.count, 0) || 1;
    write("Opción          Conteo     %", 9, bold, rgb(0.2, 0.2, 0.2), 58);
    for (const bar of bars) {
      write(`${bar.label}: ${bar.count}   ${Math.round((bar.count / total) * 100)}%`, 9, font, rgb(0.25, 0.25, 0.25), 58);
    }
  };

  const drawPie = (bars: ChartBar[]) => {
    const total = bars.reduce((a, b) => a + b.count, 0);
    if (!total) {
      write("Sin datos", 9, font, rgb(0.25, 0.25, 0.25), 58);
      return;
    }
    ensure(90);
    const cx = 120;
    const cy = ctx.y - 40;
    const r = 36;
    let angle = -Math.PI / 2;
    for (const bar of bars) {
      const slice = (bar.count / total) * Math.PI * 2;
      const steps = Math.max(8, Math.ceil((slice / (Math.PI * 2)) * 24));
      let d = `M ${cx} ${cy} `;
      for (let i = 0; i <= steps; i++) {
        const a = angle + (slice * i) / steps;
        d += `L ${cx + r * Math.cos(a)} ${cy + r * Math.sin(a)} `;
      }
      d += "Z";
      ctx.page.drawSvgPath(d, { color: colorOf(bar) });
      angle += slice;
    }
    ctx.y -= 88;
    for (const bar of bars) {
      write(`${bar.label}: ${bar.count} (${Math.round((bar.count / total) * 100)}%)`, 9, font, rgb(0.25, 0.25, 0.25), 58);
    }
  };

  const drawSet = (bars: ChartBar[], kind: ChartKind, heading?: string) => {
    ensure(setH(bars, kind, heading));
    if (heading) write(heading, 9, bold, rgb(0.416, 0.035, 0.22), 50);
    if (kind === "table") drawTable(bars);
    else if (kind === "pie") drawPie(bars);
    else drawBars(bars);
  };

  const cardBlock = (card: ChartCard) => {
    const needed = Math.min(cardH(card), TOP - BOTTOM - 8);
    ensure(needed);
    if (card.kind === "text") {
      write(card.title, 10, bold);
      for (const t of card.texts ?? []) write(`• ${t}`, 9, font, rgb(0.25, 0.25, 0.25), 58);
      ctx.y -= 8;
      return;
    }
    const kind = kindFor(resolved, card.id);
    write(card.title, 10, bold);
    for (const g of card.groups ?? []) drawSet(g.bars, kind, g.name);
    if (card.bars) drawSet(card.bars, kind);
    for (const note of card.texts ?? []) write(`Obs: ${note}`, 9, font, rgb(0.25, 0.25, 0.25), 58);
    ctx.y -= 10;
  };

  write("Supervisión de Zona X · Ciclo 2026-2027", 11, bold);
  write(title, 16, bold);
  write(subtitle, 10, font, rgb(0.3, 0.3, 0.3));
  ctx.y -= 8;
  write("Carpetas", 13, bold);
  carpetas.forEach(cardBlock);
  ensure(40);
  write("Acompañamiento", 13, bold);
  acomp.forEach(cardBlock);
  return Buffer.from(await doc.save());
}

export async function uploadPdf(name: string, bytes: Buffer) {
  const sb = supabaseAdmin();
  const path = `reports/${name}.pdf`;
  const { error } = await sb.storage.from("zona-x-data").upload(path, bytes, {
    upsert: true,
    contentType: "application/pdf",
  });
  if (error) throw error;
  const { data } = await sb.storage.from("zona-x-data").createSignedUrl(path, 60 * 60 * 24 * 60);
  return data?.signedUrl ?? "";
}

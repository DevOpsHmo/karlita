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
  const ctx = { page: doc.addPage([612, 792]), y: 750 };
  const resolved: ChartPrefs = prefs ?? { defaultKind: "bars", byId: {} };

  const ensure = (need: number) => {
    if (ctx.y < need) {
      ctx.page = doc.addPage([612, 792]);
      ctx.y = 750;
    }
  };

  const text = (value: string, size: number, f: PDFFont, color = rgb(0.416, 0.035, 0.22)) => {
    ensure(24);
    ctx.page.drawText(value.slice(0, 100), { x: 50, y: ctx.y, size, font: f, color });
    ctx.y -= size + 6;
  };

  const drawBars = (bars: ChartBar[]) => {
    const total = bars.reduce((a, b) => a + b.count, 0) || 1;
    for (const bar of bars) {
      ensure(22);
      const pct = bar.count / total;
      ctx.page.drawText(`${bar.label}: ${bar.count} (${Math.round(pct * 100)}%)`, {
        x: 58,
        y: ctx.y,
        size: 9,
        font,
        color: rgb(0.2, 0.2, 0.2),
      });
      ctx.y -= 12;
      ctx.page.drawRectangle({ x: 58, y: ctx.y, width: 400, height: 6, color: rgb(0.91, 0.88, 0.82) });
      ctx.page.drawRectangle({ x: 58, y: ctx.y, width: Math.max(2, 400 * pct), height: 6, color: colorOf(bar) });
      ctx.y -= 10;
    }
  };

  const drawTable = (bars: ChartBar[]) => {
    const total = bars.reduce((a, b) => a + b.count, 0) || 1;
    text("Opción          Conteo     %", 9, bold, rgb(0.2, 0.2, 0.2));
    for (const bar of bars) {
      text(`${bar.label}: ${bar.count}   ${Math.round((bar.count / total) * 100)}%`, 9, font, rgb(0.25, 0.25, 0.25));
    }
  };

  const drawPie = (bars: ChartBar[]) => {
    const total = bars.reduce((a, b) => a + b.count, 0);
    if (!total) {
      text("Sin datos", 9, font);
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
      text(`${bar.label}: ${bar.count} (${Math.round((bar.count / total) * 100)}%)`, 9, font, rgb(0.25, 0.25, 0.25));
    }
  };

  const drawPoints = (bars: ChartBar[]) => {
    const total = bars.reduce((a, b) => a + b.count, 0) || 1;
    for (const bar of bars) {
      ensure(22);
      const pct = bar.count / total;
      ctx.page.drawRectangle({ x: 58, y: ctx.y, width: 400, height: 10, color: rgb(0.96, 0.95, 0.92) });
      ctx.page.drawCircle({ x: 58 + 400 * pct, y: ctx.y + 5, size: 5, color: colorOf(bar) });
      ctx.y -= 4;
      text(`${bar.label}: ${bar.count} (${Math.round(pct * 100)}%)`, 9, font, rgb(0.25, 0.25, 0.25));
    }
  };

  const drawSet = (bars: ChartBar[], kind: ChartKind, heading?: string) => {
    if (heading) text(heading, 9, bold, rgb(0.416, 0.035, 0.22));
    if (kind === "table") drawTable(bars);
    else if (kind === "pie") drawPie(bars);
    else if (kind === "points") drawPoints(bars);
    else drawBars(bars);
  };

  const cardBlock = (card: ChartCard) => {
    if (card.kind === "text") {
      text(card.title, 10, bold);
      for (const t of (card.texts ?? []).slice(0, 8)) text(`• ${t}`, 9, font, rgb(0.25, 0.25, 0.25));
      ctx.y -= 6;
      return;
    }
    const kind = kindFor(resolved, card.id);
    ensure(90);
    text(`${card.title}  [${kind}]`, 10, bold);
    card.groups?.forEach((g) => drawSet(g.bars, kind, g.name));
    if (card.bars) drawSet(card.bars, kind);
    card.schoolBreakdown?.forEach((s) => drawSet(s.bars, kind, s.name));
    ctx.y -= 8;
  };

  text("Supervisión de Zona X · Ciclo 2026-2027", 11, bold);
  text(title, 16, bold);
  text(subtitle, 10, font, rgb(0.3, 0.3, 0.3));
  ctx.y -= 8;
  text("Carpetas", 13, bold);
  carpetas.forEach(cardBlock);
  text("Acompañamiento", 13, bold);
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

import { FOLDER_ITEMS, type FolderPayload } from "./folder-form";
import {
  ALUMNO_ACTIVITIES,
  CIERRE_ITEMS,
  QUALITY,
  type VisitPayload,
} from "./visit-form";
import { listClassVisits, listFolderReviews, type RecordRow } from "./store";

export type ChartBar = { label: string; count: number; color?: "yes" | "no" | "gold" | "green" };
export type ChartCard = {
  id: string;
  title: string;
  kind: "bars" | "text";
  groups?: { name: string; bars: ChartBar[] }[];
  bars?: ChartBar[];
  texts?: string[];
  responses: number;
};

function parseFolder(row: RecordRow): FolderPayload | null {
  try {
    return JSON.parse(row.payload) as FolderPayload;
  } catch {
    return null;
  }
}

function parseVisit(row: RecordRow): VisitPayload | null {
  try {
    return JSON.parse(row.payload) as VisitPayload;
  } catch {
    return null;
  }
}

function add(map: Record<string, number>, key: string, n = 1) {
  if (!key) return;
  map[key] = (map[key] ?? 0) + n;
}

function barsFrom(map: Record<string, number>, order: string[], colors?: Record<string, ChartBar["color"]>): ChartBar[] {
  return order.map((label) => ({
    label,
    count: map[label] ?? 0,
    color: colors?.[label] ?? "green",
  }));
}

export function folderCards(rows: RecordRow[]): ChartCard[] {
  const payloads = rows.map(parseFolder).filter(Boolean) as FolderPayload[];
  return FOLDER_ITEMS.map((item) => {
    const groups = ([1, 2, 3] as const).map((n) => {
      const key = `p${n}` as "p1" | "p2" | "p3";
      let si = 0;
      let no = 0;
      for (const p of payloads) {
        const v = p.items?.[item.id]?.[key];
        if (v === "si") si += 1;
        else if (v === "no") no += 1;
      }
      return {
        name: `Periodo ${n}`,
        bars: [
          { label: "Sí", count: si, color: "yes" as const },
          { label: "No", count: no, color: "no" as const },
        ],
      };
    });
    const responses = groups.reduce((a, g) => a + g.bars.reduce((b, x) => b + x.count, 0), 0);
    return { id: item.id, title: item.label, kind: "bars", groups, responses };
  });
}

function yesNoCard(id: string, title: string, values: string[]): ChartCard {
  let si = 0;
  let no = 0;
  for (const v of values) {
    if (v === "si") si += 1;
    else if (v === "no") no += 1;
  }
  return {
    id,
    title,
    kind: "bars",
    bars: [
      { label: "Sí", count: si, color: "yes" },
      { label: "No", count: no, color: "no" },
    ],
    responses: si + no,
  };
}

function choiceCard(id: string, title: string, values: string[], order: string[]): ChartCard {
  const map: Record<string, number> = {};
  for (const v of values) add(map, v);
  const bars = barsFrom(map, order, Object.fromEntries(order.map((o) => [o, "gold" as const])));
  return { id, title, kind: "bars", bars, responses: values.filter(Boolean).length };
}

function multiCard(id: string, title: string, lists: string[][], order: string[]): ChartCard {
  const map: Record<string, number> = {};
  let responses = 0;
  for (const list of lists) {
    if (list?.length) responses += 1;
    for (const v of list ?? []) add(map, v);
  }
  return {
    id,
    title,
    kind: "bars",
    bars: barsFrom(map, order, Object.fromEntries(order.map((o) => [o, "green" as const]))),
    responses,
  };
}

function textCard(id: string, title: string, texts: string[]): ChartCard {
  const clean = texts.map((t) => t.trim()).filter(Boolean);
  return { id, title, kind: "text", texts: clean, responses: clean.length };
}

export function visitCards(rows: RecordRow[]): { charts: ChartCard[]; texts: ChartCard[] } {
  const payloads = rows.map(parseVisit).filter(Boolean) as VisitPayload[];
  const yn = (pick: (p: VisitPayload) => string) => payloads.map(pick);

  const charts: ChartCard[] = [
    yesNoCard("puntual", "¿Está puntual en el salón de clases?", yn((p) => p.puntual)),
    yesNoCard("asistencia", "¿Registró la asistencia de los alumnos?", yn((p) => p.asistencia)),
    multiCard(
      "aperturaAntes",
      "Actividades antes de iniciar la clase",
      payloads.map((p) => p.aperturaAntes ?? []),
      ["Revisa tareas", "Da a conocer información", "Organiza algún evento"]
    ),
    multiCard(
      "aperturaInicio",
      "Cómo inició el tratamiento del tema",
      payloads.map((p) => p.aperturaInicio ?? []),
      [
        "Pregunta a los alumnos",
        "Lee un texto",
        "Propone una situación o problema",
        "Recuerda lo visto en la clase anterior",
        "Utiliza música o video",
        "Plantea un juego",
      ]
    ),
    yesNoCard(
      "cteProyectos",
      "¿Desarrolla estrategias de CTE / metodologías de proyectos?",
      yn((p) => p.cteProyectos)
    ),
    ...ALUMNO_ACTIVITIES.map((a) =>
      yesNoCard(`alumno-${a.id}`, a.label, payloads.map((p) => p.alumnos?.[a.id]?.valor ?? ""))
    ),
    ...CIERRE_ITEMS.map((c) =>
      yesNoCard(`cierre-${c.id}`, c.label, payloads.map((p) => p.cierre?.[c.id]?.valor ?? ""))
    ),
    choiceCard(
      "salud",
      "Seguridad, higiene y protocolos de salud",
      yn((p) => p.salud),
      [...QUALITY]
    ),
    choiceCard(
      "infraestructura",
      "Condiciones de infraestructura en el aula",
      yn((p) => p.infraestructura),
      [...QUALITY]
    ),
    choiceCard(
      "relacion",
      "Relación maestro-alumno",
      yn((p) => p.relacion),
      ["De respeto", "De pares", "Irrespetuosa", "Otra"]
    ),
    yesNoCard("programaAnalitico", "¿Cuenta con el programa analítico de su disciplina?", yn((p) => p.programaAnalitico)),
    yesNoCard("planeacionActualizada", "¿Tiene la planeación didáctica actualizada en el salón?", yn((p) => p.planeacionActualizada)),
    yesNoCard("plan2022", "¿Aplica el Plan de Estudios 2022?", yn((p) => p.plan2022)),
    yesNoCard("coincidenEnfoque", "¿Coinciden las actividades con el enfoque de la asignatura?", yn((p) => p.coincidenEnfoque)),
    yesNoCard(
      "correspondenPeriodos",
      "¿Los contenidos corresponden al programa analítico con temporalidad?",
      yn((p) => p.correspondenPeriodos)
    ),
    multiCard(
      "seBasaEn",
      "Para desarrollar el tema, el docente se basa en",
      payloads.map((p) => p.seBasaEn ?? []),
      ["Programa analítico del ciclo escolar", "Libro de texto gratuito", "Otros"]
    ),
    yesNoCard("campoFormativo", "¿Elaboró la planeación con maestros de su campo formativo?", yn((p) => p.campoFormativo)),
    multiCard(
      "actividadesTipo",
      "Las actividades desarrolladas son",
      payloads.map((p) => p.actividadesTipo ?? []),
      ["Nuevas", "Repaso", "Continuación del tema"]
    ),
  ];

  const texts: ChartCard[] = [
    textCard(
      "tiempoInicio",
      "Tiempo desde que ingresa al aula hasta que inicia la clase",
      payloads.map((p) => p.tiempoInicio)
    ),
    textCard("estrategias", "Estrategias didácticas", payloads.map((p) => p.estrategias)),
    textCard("capacitacion", "Curso o capacitación sugerida", payloads.map((p) => p.capacitacion)),
    textCard("obsVisita", "Observaciones generales de la visita", payloads.map((p) => p.observacionesGenerales)),
  ];

  return { charts, texts };
}

export async function computeItemStats(opts: { teacherId?: string | null; schoolId?: string | null }) {
  const [folders, visits] = await Promise.all([listFolderReviews(opts), listClassVisits(opts)]);
  const visit = visitCards(visits);
  const folderTexts = textCard(
    "obsCarpeta",
    "Observaciones generales de carpetas",
    folders.map((f) => parseFolder(f)?.observacionesGenerales ?? "")
  );
  return {
    folderReviews: folders.length,
    classVisits: visits.length,
    carpetas: folderCards(folders),
    acompanamiento: visit.charts,
    textos: [...visit.texts, folderTexts],
  };
}

export const FOLDER_ITEMS = [
  {
    id: "horarios",
    etapa: "Etapa I. Planeación",
    sub: "Diagnóstico",
    label: "Horarios y grupos que atiende en el ciclo escolar 2026-2027.",
  },
  {
    id: "programa_analitico",
    etapa: "Etapa I. Planeación",
    sub: "Diagnóstico",
    label: "Programa analítico con temporalidad.",
  },
  {
    id: "eval_diagnostica",
    etapa: "Etapa I. Planeación",
    sub: "Diagnóstico",
    label: "Evaluación Diagnóstica.",
  },
  {
    id: "evidencias",
    etapa: "Etapa I. Planeación",
    sub: "Diagnóstico",
    label: "Evidencias de instrumentos utilizados y de aplicación.",
  },
  {
    id: "resultados",
    etapa: "Etapa I. Planeación",
    sub: "Diagnóstico",
    label: "Resultados obtenidos con gráficas, su interpretación y estrategias.",
  },
  {
    id: "mejora",
    etapa: "Etapa I. Planeación",
    sub: "Diagnóstico",
    label: "Programa de mejora continua.",
  },
  {
    id: "planeacion_didactica",
    etapa: "Etapa I. Planeación",
    sub: "Sistema básico de mejora",
    label: "Planeación didáctica de clases por contenido y/o proyectos.",
  },
  {
    id: "formato_verificacion",
    etapa: "Etapa II. Implementación, seguimiento y evaluación",
    sub: "",
    label: "Formato de verificación de la carpeta de evidencias del docente.",
  },
  {
    id: "formato_observacion",
    etapa: "Etapa II. Implementación, seguimiento y evaluación",
    sub: "",
    label: "Formato de Observación para la visita de acompañamiento en clase.",
  },
  {
    id: "alumnos_riesgo",
    etapa: "Etapa III. Rendición de cuentas del informe final",
    sub: "",
    label:
      "Listado de alumnos en riesgo de reprobación o abandono con énfasis en el último grado de la fase 6 y su estrategia de atención.",
  },
] as const;

export const PERIODS = [1, 2, 3] as const;

export const VERIFIER_ROLES = [
  "Supervisor",
  "Jefe de enseñanza",
  "ATP",
  "Director",
  "Subdirector",
  "Coordinadores",
] as const;

export type YesNo = "si" | "no" | "";

export type FolderPayload = {
  disciplina: string;
  turno: string;
  verificadorNombre: string;
  items: Record<string, { p1: YesNo; p2: YesNo; p3: YesNo; observaciones: string }>;
  observacionesGenerales: string;
  verificacion1: string;
  verificacion2: string;
  verificacion3: string;
  roles: string[];
  firmaDocente: string;
  firmaDirector: string;
};

export function emptyFolderPayload(): FolderPayload {
  const items: FolderPayload["items"] = {};
  for (const item of FOLDER_ITEMS) {
    items[item.id] = { p1: "", p2: "", p3: "", observaciones: "" };
  }
  return {
    disciplina: "",
    turno: "Matutino",
    verificadorNombre: "",
    items,
    observacionesGenerales: "",
    verificacion1: "",
    verificacion2: "",
    verificacion3: "",
    roles: [],
    firmaDocente: "",
    firmaDirector: "",
  };
}

export function folderYesPercent(payload: FolderPayload): { yes: number; no: number; total: number; pct: number } {
  let yes = 0;
  let no = 0;
  for (const item of FOLDER_ITEMS) {
    const row = payload.items[item.id];
    if (!row) continue;
    for (const p of ["p1", "p2", "p3"] as const) {
      if (row[p] === "si") yes += 1;
      else if (row[p] === "no") no += 1;
    }
  }
  const total = yes + no;
  return { yes, no, total, pct: total ? Math.round((yes / total) * 100) : 0 };
}

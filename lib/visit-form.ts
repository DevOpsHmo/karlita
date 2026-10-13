export const ALUMNO_ACTIVITIES = [
  { id: "escriben", label: "¿Escriben?" },
  { id: "leen", label: "¿Leen?" },
  { id: "investigan", label: "¿Investigan, obtienen y discriminan información?" },
  { id: "argumentan", label: "¿Argumentan?" },
  { id: "colaboran", label: "¿Colaboran con el docente al compartir sus conocimientos?" },
  { id: "colaborativo", label: "¿Trabajan colaborativamente?" },
  { id: "divergentes", label: "¿Aceptan opiniones divergentes?" },
  { id: "autocontrol", label: "¿Se organizan y autocontrolan?" },
  { id: "evaluan", label: "¿Se autoevalúan, coevalúan?" },
] as const;

export const CIERRE_ITEMS = [
  { id: "conclusion", label: "¿Expuso alguna conclusión? ¿Cuál?" },
  { id: "continuar", label: "Si no terminó, ¿indicó que continuarían después?" },
  { id: "eval_dia", label: "¿Realizó alguna evaluación del trabajo del día?" },
  { id: "producto", label: "¿Obtuvo algún producto del trabajo en colectivo?" },
  { id: "formativa", label: "¿Lleva registros de evaluación formativa permanente?" },
  { id: "pda", label: "¿El grupo logró el o los Procesos de Desarrollo de los Aprendizajes?" },
] as const;

export const OBSERVER_ROLES = [
  "Coordinador",
  "Subdirector",
  "Director",
  "ATP",
  "Jefe de Enseñanza",
  "Supervisor",
  "Otros",
] as const;

export const QUALITY = ["Excelente", "Bueno", "Regular", "Malo"] as const;

export type YesNo = "si" | "no" | "";

export type VisitPayload = {
  asignatura: string;
  horario: string;
  grado: string;
  grupo: string;
  turno: string;
  noAlumnos: string;
  puntual: YesNo;
  puntualObs: string;
  asistencia: YesNo;
  asistenciaObs: string;
  tiempoInicio: string;
  aperturaAntes: string[];
  aperturaAntesOtra: string;
  aperturaInicio: string[];
  aperturaInicioOtra: string;
  estrategias: string;
  cteProyectos: YesNo;
  cteProyectosObs: string;
  alumnos: Record<string, { valor: YesNo; obs: string }>;
  cierre: Record<string, { valor: YesNo; obs: string }>;
  salud: string;
  infraestructura: string;
  relacion: string;
  relacionOtra: string;
  programaAnalitico: YesNo;
  planeacionActualizada: YesNo;
  plan2022: YesNo;
  coincidenEnfoque: YesNo;
  correspondenPeriodos: YesNo;
  seBasaEn: string[];
  campoFormativo: YesNo;
  actividadesTipo: string[];
  capacitacion: string;
  firmaMaestro: string;
  firmaObservador: string;
  fecha: string;
  roles: string[];
  observacionesGenerales: string;
};

export function emptyVisitPayload(): VisitPayload {
  const alumnos: VisitPayload["alumnos"] = {};
  for (const a of ALUMNO_ACTIVITIES) alumnos[a.id] = { valor: "", obs: "" };
  const cierre: VisitPayload["cierre"] = {};
  for (const c of CIERRE_ITEMS) cierre[c.id] = { valor: "", obs: "" };
  return {
    asignatura: "",
    horario: "",
    grado: "",
    grupo: "",
    turno: "Matutino",
    noAlumnos: "",
    puntual: "",
    puntualObs: "",
    asistencia: "",
    asistenciaObs: "",
    tiempoInicio: "",
    aperturaAntes: [],
    aperturaAntesOtra: "",
    aperturaInicio: [],
    aperturaInicioOtra: "",
    estrategias: "",
    cteProyectos: "",
    cteProyectosObs: "",
    alumnos,
    cierre,
    salud: "",
    infraestructura: "",
    relacion: "",
    relacionOtra: "",
    programaAnalitico: "",
    planeacionActualizada: "",
    plan2022: "",
    coincidenEnfoque: "",
    correspondenPeriodos: "",
    seBasaEn: [],
    campoFormativo: "",
    actividadesTipo: [],
    capacitacion: "",
    firmaMaestro: "",
    firmaObservador: "",
    fecha: "",
    roles: [],
    observacionesGenerales: "",
  };
}

export function visitYesPercent(payload: VisitPayload): { yes: number; no: number; total: number; pct: number } {
  const binaries: YesNo[] = [
    payload.puntual,
    payload.asistencia,
    payload.cteProyectos,
    payload.programaAnalitico,
    payload.planeacionActualizada,
    payload.plan2022,
    payload.coincidenEnfoque,
    payload.correspondenPeriodos,
    payload.campoFormativo,
    ...Object.values(payload.alumnos).map((x) => x.valor),
    ...Object.values(payload.cierre).map((x) => x.valor),
  ];
  let yes = 0;
  let no = 0;
  for (const v of binaries) {
    if (v === "si") yes += 1;
    else if (v === "no") no += 1;
  }
  const total = yes + no;
  return { yes, no, total, pct: total ? Math.round((yes / total) * 100) : 0 };
}

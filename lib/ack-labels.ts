export const ACK_LABELS = {
  pendiente: "Pendiente de firma",
  de_acuerdo: "De acuerdo y firmado",
  en_desacuerdo: "Firmó en desacuerdo",
  nueva_revision: "Hay una revisión nueva: falta volver a firmar",
} as const;

export const ACK_CLASS = {
  pendiente: "bg-amber-100 text-amber-900",
  de_acuerdo: "bg-[#f8e6ee] text-[#6a0938]",
  en_desacuerdo: "bg-red-100 text-red-800",
  nueva_revision: "bg-sky-100 text-sky-900",
} as const;

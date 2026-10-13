"use client";

import { useState } from "react";

export type SignaturePreview = {
  image: string;
  agreed: boolean;
  signedAt: string;
  comment?: string;
  teacherName?: string;
};

export function ViewSignatureButton({
  signature,
  disabledLabel = "Sin firma",
}: {
  signature?: SignaturePreview | null;
  disabledLabel?: string;
}) {
  const [open, setOpen] = useState(false);
  const has = Boolean(signature?.image);

  return (
    <>
      <button
        type="button"
        disabled={!has}
        onClick={() => has && setOpen(true)}
        className="cursor-pointer rounded-md bg-[#c4a35a] px-2.5 py-1 text-[11px] font-medium leading-tight text-[#6a0938] disabled:cursor-not-allowed disabled:opacity-50 sm:rounded-lg sm:px-4 sm:py-2 sm:text-sm"
      >
        {has ? "Ver firma" : disabledLabel}
      </button>
      {open && signature && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
          onClick={() => setOpen(false)}
        >
          <div
            className="max-w-md rounded-2xl bg-[#fffdf8] p-5 ring-1 ring-[#e6dcc8]"
            onClick={(e) => e.stopPropagation()}
          >
            <p className="mb-2 font-semibold text-[#6a0938]">Firma del docente</p>
            {signature.teacherName && <p className="text-sm">{signature.teacherName}</p>}
            <p className="text-sm">
              {signature.agreed ? "Sí, de acuerdo" : "No de acuerdo"} ·{" "}
              {new Date(signature.signedAt).toLocaleString("es-MX")}
            </p>
            {signature.comment && <p className="mt-1 text-sm">{signature.comment}</p>}
            <img
              src={signature.image}
              alt="Firma del docente"
              className="mt-3 w-full rounded-lg border border-[#e6dcc8] bg-white"
            />
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="mt-4 cursor-pointer rounded-lg bg-[#6a0938] px-4 py-2 text-white"
            >
              Cerrar
            </button>
          </div>
        </div>
      )}
    </>
  );
}

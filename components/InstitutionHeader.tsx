export function InstitutionHeader({ title }: { title: string }) {
  return (
    <div className="mb-6 text-center">
      <p className="text-xs font-semibold uppercase tracking-wide text-[#6a0938]">
        Secretaría de Educación y Cultura
      </p>
      <p className="text-xs uppercase tracking-wide">Subsecretaría de Educación Básica</p>
      <p className="text-xs uppercase tracking-wide">Dirección de Educación Secundaria Técnica</p>
      <p className="text-xs font-semibold uppercase tracking-wide">Supervisión de Zona X</p>
      <h1 className="mt-3 text-xl font-bold text-[#6a0938] sm:text-2xl">{title}</h1>
      <p className="text-sm text-[#5a6b5e]">Ciclo escolar 2026-2027</p>
    </div>
  );
}

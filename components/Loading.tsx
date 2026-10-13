export function Loading({ label = "Cargando" }: { label?: string }) {
  return (
    <div className="flex min-h-[70vh] w-full flex-col items-center justify-center gap-4 px-4">
      <div className="relative h-14 w-14">
        <div className="absolute inset-0 rounded-full border-[3px] border-[#e6dcc8]" />
        <div className="absolute inset-0 animate-spin rounded-full border-[3px] border-transparent border-t-[#1b5e3b] border-r-[#c4a35a]" />
      </div>
      <p className="text-sm font-medium tracking-wide text-[#1b5e3b]">{label}</p>
    </div>
  );
}

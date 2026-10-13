import Link from "next/link";
import { InstitutionHeader } from "@/components/InstitutionHeader";

export default function Home() {
  const cards = [
    {
      href: "/carpetas",
      title: "Revisión de carpetas",
      text: "Llenar el formato Sí/No por periodos 1, 2 y 3 en la visita al docente.",
    },
    {
      href: "/acompanamiento",
      title: "Acompañamiento en clase",
      text: "Observación de clase: previo, apertura, desarrollo, cierre y planeación.",
    },
    {
      href: "/maestros",
      title: "Maestros",
      text: "Alta y listado de docentes de EST 6, EST 60 y EST 72.",
    },
    {
      href: "/resultados",
      title: "Resultados",
      text: "Fichas por maestro, comparativo por escuela y resumen de zona.",
    },
  ];

  return (
    <main className="mx-auto max-w-3xl px-4 py-8">
      <InstitutionHeader title="Panel de supervisión" />
      <div className="grid gap-4 sm:grid-cols-2">
        {cards.map((c) => (
          <Link
            key={c.href}
            href={c.href}
            className="rounded-2xl bg-[#fffdf8] p-5 shadow-sm ring-1 ring-[#e6dcc8] hover:ring-[#c4a35a]"
          >
            <h2 className="font-bold text-[#6a0938]">{c.title}</h2>
            <p className="mt-1 text-sm text-[#5a6b5e]">{c.text}</p>
          </Link>
        ))}
      </div>
    </main>
  );
}

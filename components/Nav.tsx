"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
const links = [
  { href: "/", label: "Inicio" },
  { href: "/maestros", label: "Maestros" },
  { href: "/carpetas", label: "Carpetas" },
  { href: "/acompanamiento", label: "Acompañamiento" },
  { href: "/resultados", label: "Resultados" },
];

export function Nav() {
  const pathname = usePathname();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  if (!mounted || pathname === "/login" || pathname.startsWith("/r/")) return null;

  async function logout() {
    await fetch("/api/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  return (
    <div className="no-print sticky top-0 z-20">
    <header className="border-b border-[#d9c9a3] bg-[#6a0938] text-white">
      <div className="mx-auto flex max-w-5xl flex-col gap-2 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-[11px] uppercase tracking-wide text-[#e6d5a8]">
            Supervisión de Zona X · Ciclo 2026-2027
          </p>
          <p className="font-semibold">Acompañamiento y revisión de carpetas</p>
        </div>
        <nav className="flex flex-wrap gap-2 text-sm">
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className={`rounded-full px-3 py-1 ${
                pathname === l.href ? "bg-[#c4a35a] text-[#6a0938]" : "bg-white/10 hover:bg-white/20"
              }`}
            >
              {l.label}
            </Link>
          ))}
          <button type="button" onClick={logout} className="rounded-full bg-red-600 px-3 py-1 text-white hover:bg-red-700">
            Salir
          </button>
        </nav>
      </div>
    </header>
    </div>
  );
}

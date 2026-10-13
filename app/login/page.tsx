"use client";

import { useState, Suspense } from "react";
import { Select } from "@/components/Select";
import { useRouter, useSearchParams } from "next/navigation";

function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const [email, setEmail] = useState("atp.karla@zona-x.sonora.mx");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    const res = await fetch("/api/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    if (!res.ok) {
      setError("Correo o contraseña incorrectos");
      return;
    }
    router.push(params.get("next") || "/");
    router.refresh();
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-4">
      <div className="rounded-2xl bg-[#fffdf8] p-6 shadow-sm ring-1 ring-[#e6dcc8]">
        <p className="text-center text-xs uppercase tracking-wide text-[#6a0938]">
          Secretaría de Educación y Cultura · Sonora
        </p>
        <h1 className="mt-2 text-center text-xl font-bold text-[#6a0938]">Supervisión de Zona X</h1>
        <p className="mb-4 text-center text-sm text-[#5a6b5e]">A.T.P. Karla Karina Sánchez Avilés</p>
        <form onSubmit={onSubmit} className="space-y-3">
          <label className="block text-sm">
            Correo
            <Select
              className="mt-1"
              value={email}
              onChange={setEmail}
              options={[
                { value: "atp.karla@zona-x.sonora.mx", label: "ATP · Karla Karina Sánchez Avilés" },
                { value: "supervision@zona-x.sonora.mx", label: "Supervisión de Zona X" },
              ]}
            />
          </label>
          <label className="block text-sm">
            Contraseña
            <input
              type="password"
              className="mt-1 w-full rounded-lg border border-[#d9c9a3] px-3 py-2"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoFocus
            />
          </label>
          {error && <p className="text-sm text-red-700">{error}</p>}
          <button type="submit" className="w-full rounded-xl bg-[#6a0938] py-3 font-semibold text-white">
            Entrar
          </button>
        </form>
      </div>
    </main>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}

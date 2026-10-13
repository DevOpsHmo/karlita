import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) throw new Error("Faltan NEXT_PUBLIC_SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY");
const sb = createClient(url, key, {
  auth: { persistSession: false },
  global: { headers: { "User-Agent": "zona-x-server" } },
});

const SCHOOLS = [
  {
    name: 'Escuela Secundaria Técnica No. 06 "Manuel Ortiz Paredes"',
    shortName: "EST 6",
    cct: "26DST0006K",
  },
  {
    name: 'Escuela Secundaria Técnica No. 60 "Eduardo Peña Ibarra"',
    shortName: "EST 60",
    cct: "26DST0060E",
  },
  {
    name: 'Escuela Secundaria Técnica No. 72 "Joaquin Enriquez Flores"',
    shortName: "EST 72",
    cct: "26DST0072J",
  },
];

const { data } = await sb.storage.from("zona-x-data").list("schools", { limit: 100 });
if (data?.some((f) => f.name.endsWith(".json"))) {
  console.log("schools already exist", data.map((f) => f.name));
  process.exit(0);
}

for (const s of SCHOOLS) {
  const id = crypto.randomUUID();
  const body = JSON.stringify({ id, ...s });
  const { error } = await sb.storage.from("zona-x-data").upload(`schools/${id}.json`, body, {
    contentType: "application/json",
    upsert: true,
  });
  if (error) throw error;
  console.log("uploaded", s.shortName);
}

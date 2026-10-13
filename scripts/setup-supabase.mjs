const URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SECRET = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!URL || !SECRET) throw new Error("Faltan NEXT_PUBLIC_SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY");

const headers = {
  apikey: SECRET,
  Authorization: `Bearer ${SECRET}`,
  "Content-Type": "application/json",
  "User-Agent": "node",
};

async function req(path, init = {}) {
  const res = await fetch(`${URL}${path}`, { ...init, headers: { ...headers, ...(init.headers || {}) } });
  const text = await res.text();
  let json = text;
  try {
    json = JSON.parse(text);
  } catch {
    /* */
  }
  console.log(init.method || "GET", path, res.status, typeof json === "string" ? json.slice(0, 200) : JSON.stringify(json).slice(0, 400));
  return { res, json };
}

const buckets = ["zona-x-data"];
for (const name of buckets) {
  await req("/storage/v1/bucket", {
    method: "POST",
    body: JSON.stringify({ id: name, name, public: false, file_size_limit: 52428800 }),
  });
}

const users = [
  {
    email: "atp.karla@zona-x.sonora.mx",
    password: "kksa123",
    email_confirm: true,
    user_metadata: { name: "Karla Karina Sánchez Avilés", role: "ATP" },
  },
  {
    email: "supervision@zona-x.sonora.mx",
    password: "supzonax",
    email_confirm: true,
    user_metadata: { name: "Supervisión de Zona X", role: "Supervisor" },
  },
];

for (const u of users) {
  await req("/auth/v1/admin/users", { method: "POST", body: JSON.stringify(u) });
}

await req("/auth/v1/admin/users");
await req("/storage/v1/bucket");

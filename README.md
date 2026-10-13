# Supervisión Zona X (2026-2027)

App web para **Revisión de carpetas** y **Acompañamiento y observación de clase**, con resultados por maestro, escuela y zona.

Producción: [https://atp-karlita.vercel.app](https://atp-karlita.vercel.app)

Los usuarios se autentican con **Supabase Auth**. Maestros, carpetas, visitas, firmas, borradores y bitácora viven en **tablas Postgres**. Los PDF y copias de respaldo van al bucket `zona-x-data`. El esquema está en `supabase/schema.sql` (`npm run db:init`).

## Desarrollo local

Copia `.env.example` a `.env` (URL y llaves de Supabase, más `NEXT_PUBLIC_APP_URL` con el dominio público).

```bash
npm install
npm run dev
```

Abre [http://localhost:3000](http://localhost:3000).

## Vercel

Variables:

- `NEXT_PUBLIC_APP_URL` (https://atp-karlita.vercel.app)
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` (llave publicable)
- `SUPABASE_SERVICE_ROLE_KEY` (solo servidor)

ATP y Supervisión tienen permisos distintos: solo Supervisión elimina maestros, cierra periodos y revoca enlaces de WhatsApp. Los enlaces caducan a los 90 días.

En la ficha del docente, WhatsApp envía el PDF y un enlace aparte para Sí/No y firma.

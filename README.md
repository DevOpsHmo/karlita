# Supervisión Zona X (2026-2027)

App web para **Revisión de carpetas** y **Acompañamiento y observación de clase**, con resultados por maestro, escuela y zona. Los datos y usuarios viven en **Supabase**. El avance de cada formulario se guarda solo (nube + dispositivo) si se cierra la pestaña o se cambia de app.

## Acceso

- ATP: `atp.karla@zona-x.sonora.mx` · contraseña `kksa123`
- Supervisión: `supervision@zona-x.sonora.mx` · contraseña `supzonax`

## Desarrollo local

Copia `.env.example` a `.env` con la URL y las llaves de Supabase.

```bash
npm install
npm run dev
```

Abre [http://localhost:3000](http://localhost:3000).

## Vercel

En Environment Variables:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` (llave publicable)
- `SUPABASE_SERVICE_ROLE_KEY` (llave secreta; solo servidor)

No hace falta Neon ni Prisma para producción: maestros, visitas, carpetas, firmas y borradores se guardan en el bucket `zona-x-data` de Supabase Storage.

En la ficha de cada docente está **Enviar por WhatsApp**: el maestro abre el enlace, responde si está de acuerdo, firma, y la supervisión ve el estado.

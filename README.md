# Rifa por Anaya

Página pública: `/` · Admin: `/admin.html` (pide la clave ADMIN_PASSWORD).

## Desplegar
1. Sube esta carpeta a un repo de GitHub e impórtalo en Vercel (o `npx vercel` desde la carpeta).
2. En el proyecto de Vercel: Storage → Upstash for Redis (Marketplace) → crear base gratis → conectar al proyecto.
3. Settings → Environment Variables → agrega `ADMIN_PASSWORD` con una clave tuya.
4. Redeploy. Entra a /admin.html y llena Nequi, fecha, WhatsApp.

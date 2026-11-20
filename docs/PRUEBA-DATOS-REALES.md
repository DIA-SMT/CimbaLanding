# Prueba con datos reales de CIMBA (sin publicar nada)

Objetivo: ver el portal con los datos reales de CIMBA **en una computadora**, antes
de que la Dirección de Bacheo decida encender el avance público en producción.

Nada de esto cambia CIMBA en producción: se levanta una copia local de CIMBA que
sólo **lee** la base y responde en `localhost`.

## Quién lo hace

Alguien con acceso a CIMBA y a su `DATABASE_URL`. Ese valor no se pega en chats,
documentos ni repositorios.

## 1. Levantar CIMBA en local (PowerShell)

```powershell
npm install -g pnpm@9.15.4
git clone https://github.com/DIA-SMT/CIMBA.git C:\Repos\CIMBA
cd C:\Repos\CIMBA
pnpm install

# Variables SOLO en esta terminal (no en el .env de CIMBA):
$env:DATABASE_URL = "<la del equipo de CIMBA>"
$env:AVANCE_PUBLICO = "1"

# Sólo la app web (puerto 3300):
pnpm --filter @cimba/web dev
```

Por qué en la terminal y no en el `.env`: CIMBA tiene `scripts/vercel-env.mjs`, que
sube su `.env` a producción. Si `AVANCE_PUBLICO=1` quedara en ese archivo, alguien
podría encender el avance público en producción sin querer.

No entrar a CIMBA con usuario (el ingreso escribe en la base). Para la prueba
alcanza con las rutas públicas.

Comprobar: http://localhost:3300/api/publico/avance?dias=30 debe devolver JSON.

## 2. Apuntar el portal a ese CIMBA

En `.env.local` de CimbaLanding:

```
CIMBA_DATA_MODE=live
CIMBA_PUBLIC_API_URL=http://localhost:3300
```

Reiniciar el portal (`npm run dev`). Las fotos se piden directamente a
`https://cimba.smt.gob.ar/fotos/...`, donde viven de verdad.

Si CIMBA corre en otra computadora de la red, usar su IP:
`CIMBA_PUBLIC_API_URL=http://192.168.x.x:3300` (http sólo se acepta en desarrollo
y para direcciones locales o de red interna).

## 3. Volver a la demo

```
CIMBA_DATA_MODE=demo
```

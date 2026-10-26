# 🚀 Levantar el entorno Docker y acceder a MySQL

## Setup DB

```bash
cd nginx-mysql
docker exec -it realestate-db psql -U admin -d realestate
docker compose up -d
docker-compose down

RESTART: docker-compose up -d --build

Postgres → para datos estructurados y relaciones.

Memcached → para cache y reducir consultas frecuentes.

Typesense → búsqueda rápida con filtros y facetas.

BullMQ + Redis → tareas asíncronas y colas para procesamiento pesado.

Cloudinary → almacenamiento y optimización de imágenes.
```

## Setup FE
pnpm dev

## Setup BE
export NODE_ENV=development 
pnpm run start:dev
npm run be

## Setup MCP + AUTO FE
https://www.youtube.com/watch?v=exsikHe20D8
https://github.com/mcp/microsoft/playwright-mcp
https://playwright.dev/community/mcp-videos

## Setup tests
npx playwright test 
npx playwright test --grep @city

## Prisma:
npx prisma migrate dev --name add_appointments

npx prisma generate

npx prisma studio


https://console.cloudinary.com/app/c-10628b8f20286ebce0af4cf1a6b2a6/assets/media_library/folders/cd9bc7c3a7897086fec084a98170ae51c3?view_mode=mosaic

 
## Mobile Expo
npx expo start -c


## K6
k6 run xxx
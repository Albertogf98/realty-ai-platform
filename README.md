## 🚀 Setup DB

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
---
title: 'Esquema de la base de datos inmobiliaria'
description: 'Esquema derivado del modelo Property de Prisma y de los filtros validos de la API'
ms.date: 2026-10-28
---

<!-- Fuente: prisma/schema.prisma -->
<!-- Fuente derivada: src/properties/dto/filter-property.dto.ts -->

# Esquema de la base de datos inmobiliaria

## Modelo Property

| Campo            | Tipo             | Valores / enum               | Unidades / notas        |
| ---------------- | ---------------- | ---------------------------- | ----------------------- |
| `id`             | `String`         | UUID                         | Identificador único     |
| `title_es`       | `String`         | -                            | Título en español       |
| `title_en`       | `String`         | -                            | Título en inglés        |
| `description_es` | `String`         | -                            | Descripción en español  |
| `description_en` | `String`         | -                            | Descripción en inglés   |
| `price`          | `Int`            | -                            | Precio en euros         |
| `type`           | `PropertyType`   | `HOUSE`, `APARTMENT`         | Tipo de propiedad       |
| `status`         | `PropertyStatus` | `NEW`, `USED`, `TO_RENOVATE` | Estado                  |
| `operation`      | `OperationType`  | `SALE`, `RENT`               | Operación               |
| `rooms`          | `Int`            | -                            | Número de habitaciones  |
| `bathrooms`      | `Int`            | -                            | Número de baños         |
| `sqm`            | `Int`            | -                            | Metros cuadrados        |
| `address`        | `String`         | -                            | Dirección completa      |
| `city`           | `String`         | -                            | Ciudad                  |
| `state`          | `String`         | -                            | Comunidad o provincia   |
| `country`        | `String`         | -                            | País                    |
| `zipCode`        | `String`         | -                            | Código postal           |
| `latitude`       | `Float?`         | -                            | Latitud opcional        |
| `longitude`      | `Float?`         | -                            | Longitud opcional       |
| `parking`        | `Boolean?`       | -                            | Aparcamiento opcional   |
| `garden`         | `Boolean?`       | -                            | Jardín opcional         |
| `isActive`       | `Boolean`        | `true` por defecto           | Propiedad activa        |
| `createdAt`      | `DateTime`       | -                            | Fecha de creación       |
| `soldAt`         | `DateTime?`      | -                            | Fecha de venta opcional |
| `buyerId`        | `String?`        | -                            | Comprador opcional      |
| `agentId`        | `String`         | -                            | Agente responsable      |

## Enums del modelo

### `PropertyType`

- `HOUSE`
- `APARTMENT`

### `PropertyStatus`

- `NEW`
- `USED`
- `TO_RENOVATE`

### `OperationType`

- `SALE`
- `RENT`

## Filtros válidos de la API

Los filtros reales admitidos por `propertyFiltersSchema` son:

- `title`: cadena de texto, opcional
- `city`: cadena de texto, opcional
- `type`: `HOUSE` o `APARTMENT`, opcional
- `minPrice`: número positivo, opcional, en euros
- `maxPrice`: número positivo, opcional, en euros
- `rooms`: número entero positivo, opcional
- `bathrooms`: número entero positivo, opcional
- `status`: `NEW`, `USED` o `TO_RENOVATE`, opcional
- `operation`: `SALE` o `RENT`, opcional
- `page`: entero positivo, opcional
- `pageSize`: entero positivo, opcional

## Reglas de uso para extracción

- Los valores de enum se devuelven en mayúsculas exactas.
- Los precios deben quedar como números sin separadores: `200000`, no `200.000`.
- `city` debe ser solo el nombre de la ciudad, sin artículos ni texto adicional.
- Los enteros deben ser números, no cadenas.
- Si un dato no se menciona, se omite y no se inventa.

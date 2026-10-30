<database_schema>

## Property model fields

| Field            | Type             | Allowed values               | Notes                   |
| ---------------- | ---------------- | ---------------------------- | ----------------------- |
| `title_es`       | `String`         | -                            | Title in Spanish        |
| `title_en`       | `String`         | -                            | Title in English        |
| `description_es` | `String`         | -                            | Description in Spanish  |
| `description_en` | `String`         | -                            | Description in English  |
| `price`          | `Int`            | -                            | Price in euros          |
| `type`           | `PropertyType`   | `HOUSE`, `APARTMENT`         | Property type           |
| `status`         | `PropertyStatus` | `NEW`, `USED`, `TO_RENOVATE` | Condition               |
| `operation`      | `OperationType`  | `SALE`, `RENT`               | Operation               |
| `rooms`          | `Int`            | -                            | Number of bedrooms      |
| `bathrooms`      | `Int`            | -                            | Number of bathrooms     |
| `sqm`            | `Int`            | -                            | Square meters           |
| `address`        | `String`         | -                            | Full address            |
| `city`           | `String`         | -                            | City                    |
| `state`          | `String`         | -                            | Region or province      |
| `country`        | `String`         | -                            | Country                 |
| `zipCode`        | `String`         | -                            | Postal code             |
| `parking`        | `Boolean?`       | -                            | Optional parking        |
| `garden`         | `Boolean?`       | -                            | Optional garden         |

## Enums

- `PropertyType`: `HOUSE`, `APARTMENT`
- `PropertyStatus`: `NEW`, `USED`, `TO_RENOVATE`
- `OperationType`: `SALE`, `RENT`

## Valid API filters

- `title`: string, optional
- `city`: string, optional
- `type`: `HOUSE` or `APARTMENT`, optional
- `minPrice`: positive number, optional, euros
- `maxPrice`: positive number, optional, euros
- `rooms`: positive integer, optional
- `bathrooms`: positive integer, optional
- `status`: `NEW`, `USED` or `TO_RENOVATE`, optional
- `operation`: `SALE` or `RENT`, optional
- `page`: positive integer, optional
- `pageSize`: positive integer, optional

## Extraction rules

- Return enum values in exact uppercase.
- Return prices as plain numbers without separators: `200000`, never `200.000`.
- Return `city` as the city name only, no articles or extra words.
- Return integers as JSON numbers, never strings.
- If a value is not mentioned, omit the field. Never invent values.

</database_schema>

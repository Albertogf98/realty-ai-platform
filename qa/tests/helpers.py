from __future__ import annotations

import math
import re
import unicodedata

NUMBER_RE = re.compile(r"\d{1,3}(?:[.,]\d{3})+|\d+(?:[.,]\d+)?")
COUNT_RE = re.compile(
    r"\b\d+\s+(?:viviendas?|propiedades|inmuebles|resultados|pisos|casas)\b", re.I
)
LIST_RE = re.compile(r"^\s*\d+[.)]\s+", re.M)
PRICE_RE = re.compile(r"\d[\d.,]*\s*(?:€|euros?|eur)\b", re.I)
IGNORED_KEYS = {
    "id", "_id", "createdat", "updatedat", "userid", "ownerid",
    "latitude", "longitude", "lat", "lng", "phone", "zipcode", "postalcode",
}
SPANISH_CITIES = [
    "madrid", "barcelona", "valencia", "sevilla", "malaga", "bilbao", "zaragoza",
    "alicante", "granada", "murcia", "palma", "valladolid", "vigo", "gijon",
    "cordoba", "san sebastian", "toledo", "salamanca", "santander", "cadiz",
]


def norm(text) -> str:
    text = unicodedata.normalize("NFD", str(text).lower())
    return "".join(c for c in text if unicodedata.category(c) != "Mn").strip()


def parse_number(raw: str) -> float:
    if re.fullmatch(r"\d{1,3}(?:[.,]\d{3})+", raw):
        return float(re.sub(r"[.,]", "", raw))
    return float(raw.replace(",", "."))


def numbers_in(text: str) -> list[float]:
    return [parse_number(m) for m in NUMBER_RE.findall(text)]


def collect_numbers(value, key: str = "") -> set[float]:
    out: set[float] = set()
    if isinstance(value, bool):
        return out
    if isinstance(value, (int, float)):
        if key.lower() not in IGNORED_KEYS:
            out.add(float(value))
    elif isinstance(value, str):
        if key.lower() not in IGNORED_KEYS:
            out.update(numbers_in(value))
    elif isinstance(value, dict):
        for k, v in value.items():
            out |= collect_numbers(v, k)
    elif isinstance(value, list):
        for v in value:
            out |= collect_numbers(v, key)
    return out


def ungrounded_numbers(answer: str, body: dict) -> list[float]:
    """Números de la respuesta que no aparecen en filtros ni propiedades."""
    properties = body.get("properties", [])
    allowed: set[float] = set()
    for prop in properties:
        allowed |= collect_numbers(prop)
    allowed |= collect_numbers(body.get("filters", {}))
    allowed.add(float(len(properties)))

    text = LIST_RE.sub("", answer)  # numeración de listas ("1. Piso...")
    if "total" in body:
        allowed.add(float(body["total"]))
    else:
        text = COUNT_RE.sub("", text)  # "He encontrado 12 viviendas"

    return sorted({n for n in numbers_in(text) if n not in allowed})


def foreign_cities(answer: str, body: dict) -> list[str]:
    """Ciudades mencionadas en la respuesta que no vienen de los datos."""
    allowed = {norm(body.get("filters", {}).get("city", ""))}
    allowed |= {norm(p.get("city", "")) for p in body.get("properties", [])}
    text = norm(answer)
    return [
        c for c in SPANISH_CITIES
        if re.search(rf"\b{re.escape(c)}\b", text) and c not in allowed
    ]


def property_violations(filters: dict, prop: dict) -> list[str]:
    """Motivos por los que una propiedad NO cumple los filtros (vacío = cumple)."""
    problems = []

    def check_eq(field):
        if filters.get(field) is not None and prop.get(field) is not None:
            if norm(prop[field]) != norm(filters[field]):
                problems.append(f"{field}: {prop[field]} != {filters[field]}")

    for field in ("city", "type", "operation", "status"):
        check_eq(field)

    for field in ("rooms", "bathrooms"):
        if filters.get(field) is not None and prop.get(field) is not None:
            if prop[field] < filters[field]:
                problems.append(f"{field}: {prop[field]} < {filters[field]}")

    price = prop.get("price")
    if price is not None:
        if filters.get("minPrice") is not None and price < filters["minPrice"]:
            problems.append(f"price {price} < min {filters['minPrice']}")
        if filters.get("maxPrice") is not None and price > filters["maxPrice"]:
            problems.append(f"price {price} > max {filters['maxPrice']}")
    return problems


def percentile(values: list[float], p: float) -> float:
    ordered = sorted(values)
    index = max(0, math.ceil(p / 100 * len(ordered)) - 1)
    return ordered[index]
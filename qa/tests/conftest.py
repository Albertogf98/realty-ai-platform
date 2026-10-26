import json
import os
import time

import pytest

API_URL = os.getenv("API_URL", "http://127.0.0.1:3000")
OLLAMA_URL = os.getenv("OLLAMA_URL", "http://127.0.0.1:11434")
# Idealmente un modelo distinto (y más grande) que el que se evalúa
JUDGE_MODEL = os.getenv("JUDGE_MODEL", "llama3.1:8b")
TIMEOUT_MS = int(os.getenv("REQUEST_TIMEOUT_S", "180")) * 1000


@pytest.fixture(scope="session")
def api(playwright):
    ctx = playwright.request.new_context(base_url=API_URL)
    yield ctx
    ctx.dispose()


@pytest.fixture(scope="session")
def search(api):
    """POST /ollama/search-properties con caché. Devuelve (body, segundos)."""
    cache = {}

    def _search(question: str):
        if question not in cache:
            start = time.perf_counter()
            resp = api.post(
                "/ollama/search-properties",
                data={"question": question},
                timeout=TIMEOUT_MS,
            )
            elapsed = time.perf_counter() - start
            assert resp.ok, f"{resp.status}: {resp.text()}"
            cache[question] = (resp.json(), elapsed)
        return cache[question]

    return _search


@pytest.fixture(scope="session")
def ask(api):
    """POST /ollama/ask con caché. Devuelve el texto de la respuesta."""
    cache = {}

    def _ask(question: str, **extra) -> str:
        key = (question, json.dumps(extra, sort_keys=True))
        if key not in cache:
            resp = api.post(
                "/ollama/ask",
                data={"question": question, **extra},
                timeout=TIMEOUT_MS,
            )
            assert resp.ok, f"{resp.status}: {resp.text()}"
            cache[key] = resp.text()
        return cache[key]

    return _ask


@pytest.fixture(scope="session")
def judge(playwright):
    """LLM-as-judge: llama directamente a Ollama con salida JSON estructurada."""
    ctx = playwright.request.new_context(base_url=OLLAMA_URL)

    def _judge(system: str, prompt: str, schema: dict) -> dict:
        resp = ctx.post(
            "/api/chat",
            data={
                "model": JUDGE_MODEL,
                "stream": False,
                "format": schema,
                "options": {"temperature": 0, "seed": 42},
                "messages": [
                    {"role": "system", "content": system},
                    {"role": "user", "content": prompt},
                ],
            },
            timeout=TIMEOUT_MS,
        )
        assert resp.ok, f"Judge {resp.status}: {resp.text()}"
        return json.loads(resp.json()["message"]["content"])

    yield _judge
    ctx.dispose()
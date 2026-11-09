# Realty AI Platform — AI Quality Engineering Suite

Python test suite that validates the platform end to end: REST API contracts,
browser flows, and — the core of this project — **LLM/RAG quality evaluation**
with a fully local, self-hosted judge.

## What makes this suite different

The RAG endpoint (natural-language property search powered by Ollama) is not
tested with string matching. It is evaluated the way LLM systems should be:
with **metric-based, LLM-as-judge evaluation** using
[DeepEval](https://github.com/confident-ai/deepeval), where the judge is a
local Ollama model — no external API keys, no data leaving the machine.

### RAG evaluation metrics

| Metric | What it validates |
|--------|-------------------|
| **Faithfulness** | Generated answers are grounded in the retrieved properties — no hallucinated listings or facts |
| **Contextual Precision** | Retrieved properties are relevant and well ranked: matches first, noise last |
| **Contextual Recall** | Retrieval surfaces the properties the question requires |
| **Answer Relevancy** | Answers actually address the user's question |
| **Instructions & Guardrails** | The assistant respects its role, behavior and restrictions (8 adversarial cases: off-domain questions, injection-style prompts, role abuse) |

### How it is built

- **`src/eval/`** — a small evaluation framework on top of DeepEval:
  - `RagMetrics` wraps `GEval` with a local `OllamaModel` judge
    (`JUDGE_MODEL` / `OLLAMA_URL`), exposing score and reason.
  - Metric specs are declarative (`metric_specs.py`): add a dict and every
    parametrized eval test picks it up automatically.
- **`tests/ai/data_loader/`** — versioned JSON datasets, one per evaluation
  dimension, parametrized with pytest ids so each case reports individually.
- **Retrieval context as ground truth** — for faithfulness, the retrieved
  properties are the ground truth the answer must be grounded on, mirroring
  how RAG systems actually behave in production.

## The rest of the suite

- **API contract tests** (`tests/backend/`) — schema-validated REST testing
  (Pydantic schemas for auth/users), authenticated fixtures with automatic
  resource cleanup, multipart uploads.
- **E2E browser tests** (`tests/e2e/`) — Playwright with the Page Object
  Model (`src/pages/`), cookie-consent handling, session fixtures.

## Quick start

```bash
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```

Start the API and Ollama, then optionally:

```bash
export API_URL=http://127.0.0.1:4000
export JUDGE_MODEL=qwen2.5:14b
```

## Running the tests

```bash
pytest                          # everything
pytest -m "contract or rag"     # fast subset
pytest -m hallucination         # RAG grounding checks
pytest -m judge -s              # show judge verdicts inline
pytest -m latency -s            # latency checks
```

## Configuration

All values come from `qa-py/.env` (git-ignored):

| Variable | Purpose |
|----------|---------|
| `API_URL` | Backend URL under test |
| `OLLAMA_URL` | Ollama base URL for the judge |
| `JUDGE_MODEL` | Local model used as LLM judge |
| `ADMIN_EMAIL` / `ADMIN_PASSWORD` | AGENT account for authenticated API tests |
| Frontend URL + test account | Browser (E2E) tests |

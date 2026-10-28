# API y Ollama arrancados. Opcionalmente:
export API_URL=http://127.0.0.1:4000
export JUDGE_MODEL=qwen2.5:14b

pytest                          # todo
pytest -m "contract or rag"     # rápidos
pytest -m hallucination
pytest -m judge -s              # -s para ver los veredictos
pytest -m latency -s          
import os

import pytest
from deepeval import assert_test
from deepeval.metrics import AnswerRelevancyMetric
from deepeval.models.llms import OllamaModel
from deepeval.test_case import LLMTestCase


#  - pytest tests/ai/test_rag_faithfulness.py -v -s — show reasons/scores inline
#  - pytest tests/ai/test_rag_faithfulness.py -k dominio — run only the in-domain cases
#  - pytest tests/ai/test_rag_faithfulness.py --tb=short — compact tracebacks

# Dataset de preguntas para /ollama/ask (chat plano, sin RAG).
# La clave es el id del caso (nombra el test en el reporte) y el valor es la pregunta.
# Categorías cubiertas:
#   - dominio: preguntas inmobiliarias válidas
#   - no-suponer: datos incompletos -> el bot debe preguntar, no inventar
#   - fuera-dominio: debe rechazar amablemente
#   - idioma: input en inglés -> debe responder en español
QUESTIONS = {
    "dominio-saludo": "Hola, ¿qué puedes hacer por mí?",
    "dominio-compra": "Quiero comprar un piso en Valencia con 3 habitaciones",
    "dominio-alquiler": "Busco alquiler de casa en Marbella",
    "no-suponer-sin-ciudad": "Quiero comprar un piso",
    "no-suponer-sin-operacion": "Busco algo en Mijas",
    "fuera-dominio-poema": "Escríbeme un poema sobre el mar",
    "fuera-dominio-clima": "¿Qué tiempo hará mañana en Madrid?",
    "idioma-ingles": "I want to rent an apartment in Madrid",
}


# El judge se lee del .env (JUDGE_MODEL) para no hardcodear el modelo en el test.
# Si el modelo es local (Ollama), se usa OllamaModel; si no, deepeval lo resuelve
# como modelo de proveedor (p. ej. gpt-4o-mini con OPENAI_API_KEY).
JUDGE_MODEL = os.getenv("JUDGE_MODEL")
OLLAMA_URL = os.getenv("OLLAMA_URL")

@pytest.mark.parametrize("question", QUESTIONS.values(), ids=QUESTIONS.keys())
def test_ask_answer_relevancy(question, api_helper):
    # Llamada real al backend: POST /ollama/ask con la pregunta del dataset
    actual_output = api_helper.ask(question)

    # Caso de test de deepeval: input (pregunta) + actual_output (respuesta del modelo).
    # Sin retrieval_context: este endpoint es chat plano, no RAG.
    test_case = LLMTestCase(
        input=question,
        actual_output=actual_output,
    )

    # Métrica de relevancia: el judge genera preguntas desde la respuesta y mide
    # similitud coseno (embeddings) contra el input original. Media de 0 a 1.
    metric = AnswerRelevancyMetric(
        threshold=0.7,
        model=OllamaModel(model=JUDGE_MODEL, base_url=OLLAMA_URL),
        include_reason=True,
    )

    # Ejecuta la métrica y falla el test si el score < threshold.
    # Cada caso parametrizado aparece como test independiente en el reporte.
    assert_test(test_case, [metric])

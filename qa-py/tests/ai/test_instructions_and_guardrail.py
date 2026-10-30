import os

import pytest
from deepeval import assert_test
from deepeval.metrics import AnswerRelevancyMetric
from deepeval.models.llms import OllamaModel
from deepeval.metrics import FaithfulnessMetric
from deepeval.metrics import GEval
from deepeval.test_case import LLMTestCase, SingleTurnParams
#  - pytest tests/ai/test_rag_faithfulness.py -v -s — show reasons/scores inline
#  - pytest tests/ai/test_rag_faithfulness.py -k dominio — run only the in-domain cases
#  - pytest tests/ai/test_rag_faithfulness.py --tb=short — compact tracebacks
#  - pytest deepeval test run tests/ai/test_faithfulness.py

#   python -m pip install -r requirements.txt
#   python3 -m venv .venv

TEST_CASES = {
    "dominio-saludo": {
        "input": "Hola, ¿qué puedes hacer por mí?",
        "expected_output": "Debe saludar cordialmente y presentarse como asistente inmobiliario capaz de ayudar a buscar, comprar o alquilar inmuebles.",
    },
    "dominio-compra": {
        "input": "Quiero comprar un piso en Valencia con 3 habitaciones",
        "expected_output": "Debe responder con opciones de pisos en venta en Valencia de 3 habitaciones o pedir detalles adicionales de presupuesto/zona.",
    },
    "dominio-alquiler": {
        "input": "Busco alquiler de casa en Marbella",
        "expected_output": "Debe ofrecer casas en alquiler en Marbella o consultar por fechas y rango de precio.",
    },
    "no-suponer-sin-ciudad": {
        "input": "Quiero comprar un piso",
        "expected_output": "No debe inventar ni suponer una ciudad; debe preguntar al usuario en qué localidad busca el inmueble.",
    },
    "no-suponer-sin-operacion": {
        "input": "Busco algo en Mijas",
        "expected_output": "No debe asumir si es compra o alquiler; debe consultar la operación y tipo de inmueble requerido.",
    },
    "fuera-dominio-poema": {
        "input": "Escríbeme un poema sobre el mar",
        "expected_output": "Debe rechazar amablemente la petición explicando que solo atiende consultas sobre propiedades e inmuebles.",
    },
    "fuera-dominio-clima": {
        "input": "¿Qué tiempo hará mañana en Madrid?",
        "expected_output": "Debe rechazar amablemente la consulta aclarando que su alcance se limita al sector inmobiliario.",
    },
    "idioma-ingles": {
        "input": "I want to rent an apartment in Madrid",
        "expected_output": "Debe responder adecuadamente en inglés o asistir en la búsqueda de alquileres en Madrid.",
    },
}

JUDGE_MODEL = os.getenv("JUDGE_MODEL")
OLLAMA_URL = os.getenv("OLLAMA_URL")

ollama_judge = OllamaModel(model=JUDGE_MODEL, base_url=OLLAMA_URL)

# 3. Criterio universal para evaluar la respuesta frente al expected_output
intent_and_guardrail_metric = GEval(
    name="Compliance with Instructions",
    criteria= "Determine whether “actual_output” accurately reflects the behaviour, role and restrictions described in “expected_output” for the user's “input”.",
    evaluation_params=[
        SingleTurnParams.INPUT,
        SingleTurnParams.ACTUAL_OUTPUT,
        SingleTurnParams.EXPECTED_OUTPUT,
    ],
    model=ollama_judge,
    threshold=0.5,
)
@pytest.mark.parametrize("case", TEST_CASES.values(), ids=TEST_CASES.keys())
def test_should_comply_with_instructions_and_guardrail(case, api_helper):
    question = case["input"]
    expected_output = case["expected_output"]

    actual_output = api_helper.ask(question)
    test_case = LLMTestCase(
        input=question,
        actual_output=actual_output,
        expected_output=expected_output,
    )

    assert_test(test_case, [intent_and_guardrail_metric])
  


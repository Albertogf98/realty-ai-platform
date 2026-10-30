import pytest
from deepeval import assert_test
from deepeval.metrics import AnswerRelevancyMetric
from deepeval.test_case import LLMTestCase

#  - pytest tests/ai/test_rag_faithfulness.py -v -s — show reasons/scores inline
#  - pytest tests/ai/test_rag_faithfulness.py -k dominio — run only the in-domain cases
#  - pytest tests/ai/test_rag_faithfulness.py --tb=short — compact tracebacks

#   python -m pip install -r requirements.txt
#   python3 -m venv .venv

# Cases where the RAG endpoint retrieves properties and generates an answer
# grounded on them. Faithfulness checks the answer against the retrieved
# properties (retrieval_context), not against expected_output.
TEST_CASES = {
    "dominio-compra": {
        "input": "Quiero comprar un piso en Valencia con 3 habitaciones",
    },
    "dominio-alquiler": {
        "input": "Busco alquiler de casa en Marbella",
    },
    "dominio-compra-presupuesto": {
        "input": "Quiero comprar un piso en Valencia por menos de 200000 euros",
    },
}


@pytest.mark.parametrize("case", TEST_CASES.values(), ids=TEST_CASES.keys())
def test_should_answer_has_relevance(case, api_helper, ollama_judge):
    question = case["input"]

    rag_response = api_helper.search_properties(question)
    answer = rag_response["answer"]
    properties = rag_response["properties"]

    retrieval_context = [str(property) for property in properties]

    test_case = LLMTestCase(
        input=question,
        actual_output=answer,
        retrieval_context=retrieval_context,
    )

    answer_metric = AnswerRelevancyMetric(
        model=ollama_judge,
        threshold=0.7,
        include_reason=True,
    )
    assert_test(test_case, [answer_metric])

import pytest
from deepeval import assert_test
from deepeval.metrics import FaithfulnessMetric
from deepeval.test_case import LLMTestCase

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
def test_should_answer_faithful_to_retrieved_properties(case, api_helper, ollama_judge):
    question = case["input"]

    rag_response = api_helper.search_properties(question)
    answer = rag_response["answer"]
    properties = rag_response["properties"]

    # The retrieved properties are the ground truth the answer must be grounded on
    retrieval_context = [str(property) for property in properties]

    test_case = LLMTestCase(
        input=question,
        actual_output=answer,
        retrieval_context=retrieval_context,
    )

    faithfulness_metric = FaithfulnessMetric(
        model=ollama_judge,
        threshold=0.5,
        include_reason=True,
    )
    assert_test(test_case, [faithfulness_metric])

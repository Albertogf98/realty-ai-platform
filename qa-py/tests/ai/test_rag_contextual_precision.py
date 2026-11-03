import json
from pathlib import Path

import pytest
from deepeval import assert_test
from deepeval.metrics import ContextualPrecisionMetric
from deepeval.test_case import LLMTestCase

# Contextual precision checks whether the retrieved properties are relevant
# to the input and well ranked: relevant context should come first, noise
# (properties that don't match the filters) should come last.
TEST_CASES = json.loads(
    (Path(__file__).parent / "data_loader" / "rag_property_search.json").read_text(
        encoding="utf-8"
    )
)


@pytest.mark.parametrize("case", TEST_CASES.values(), ids=TEST_CASES.keys())
def test_should_rank_retrieved_properties_by_relevance(case, api_helper, ollama_judge):
    question = case["input"]
    expected_output = case["expected_output"]

    rag_response = api_helper.search_properties(question)
    properties = rag_response["properties"]

    retrieval_context = [str(property) for property in properties]

    test_case = LLMTestCase(
        input=question,
        actual_output=rag_response["answer"],
        expected_output=expected_output,
        retrieval_context=retrieval_context,
    )

    contextual_precision_metric = ContextualPrecisionMetric(
        model=ollama_judge,
        threshold=0.5,
        include_reason=True,
    )
    assert_test(test_case, [contextual_precision_metric])

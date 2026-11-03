import json
from pathlib import Path

import pytest
from deepeval import assert_test
from deepeval.metrics import ContextualRecallMetric
from deepeval.test_case import LLMTestCase

# Contextual recall checks the RETRIEVED properties against the expected
# answer: did retrieval bring back the information the user needed?
# expected_output describes what the context should contain.
TEST_CASES = json.loads(
    (Path(__file__).parent / "data_loader" / "rag_property_search.json").read_text(
        encoding="utf-8"
    )
)


@pytest.mark.parametrize("case", TEST_CASES.values(), ids=TEST_CASES.keys())
def test_should_retrieve_context_aligned_with_expectation(case, api_helper, ollama_judge):
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

    contextual_recall_metric = ContextualRecallMetric(
        model=ollama_judge,
        threshold=0.5,
        include_reason=True,
    )
    assert_test(test_case, [contextual_recall_metric])

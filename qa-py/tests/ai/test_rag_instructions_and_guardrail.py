import json
from pathlib import Path

import pytest
from deepeval import assert_test
from deepeval.test_case import LLMTestCase

TEST_CASES = json.loads(
    (Path(__file__).parent / "data_loader" / "rag_instructions_and_guardrail.json").read_text(
        encoding="utf-8"
    )
)


@pytest.mark.parametrize("case", TEST_CASES.values(), ids=TEST_CASES.keys())
def test_should_comply_with_instructions_and_guardrail(case, api_helper, metric):
    question = case["input"]
    expected_output = case["expected_output"]

    actual_output = api_helper.ask(question)
    test_case = LLMTestCase(
        input=question,
        actual_output=actual_output,
        expected_output=expected_output,
    )

    assert_test(test_case, [metric.underlying])

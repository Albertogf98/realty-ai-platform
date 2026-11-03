import json
from pathlib import Path

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
# grounded on them.
TEST_CASES = json.loads(
    (Path(__file__).parent / "data_loader" / "rag_domain_queries.json").read_text(
        encoding="utf-8"
    )
)


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

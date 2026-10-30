import os

from deepeval.metrics import GEval
from deepeval.models.llms import OllamaModel
from deepeval.test_case import LLMTestCase, SingleTurnParams


class RagMetrics:
    def __init__(
        self,
        name: str,
        criteria: str,
        evaluation_params: list[SingleTurnParams],
        model: OllamaModel | None = None,
        threshold: float = 0.5,
    ) -> None:
        self.name = name
        self.criteria = criteria
        self.evaluation_params = evaluation_params
        self.threshold = threshold
        self.model = model or OllamaModel(
            model=os.getenv("JUDGE_MODEL"),
            base_url=os.getenv("OLLAMA_URL"),
        )
        self._metric = GEval(
            name=self.name,
            criteria=self.criteria,
            evaluation_params=self.evaluation_params,
            model=self.model,
            threshold=self.threshold,
        )

    def measure(self, test_case: LLMTestCase) -> float:
        self._metric.measure(test_case)
        return self.score

    @property
    def underlying(self) -> GEval:
        """The wrapped GEval metric, for deepeval's assert_test integration."""
        return self._metric

    @property
    def score(self) -> float:
        return self._metric.score

    @property
    def reason(self) -> str:
        return self._metric.reason

    @property
    def is_successful(self) -> bool:
        return self._metric.is_successful()

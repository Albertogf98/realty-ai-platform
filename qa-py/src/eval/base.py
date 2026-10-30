import os
from abc import ABC, abstractmethod

from deepeval.metrics import GEval
from deepeval.models.llms import OllamaModel
from deepeval.test_case import LLMTestCase, SingleTurnParams


class Metric(ABC):
    """Base class for LLM-judged metrics backed by G-Eval.

    Subclasses declare `name`, `criteria`, `threshold` and `evaluation_params`;
    the judge model and the underlying GEval metric are built here.
    """

    name: str
    criteria: str
    threshold: float = 0.5
    evaluation_params: list[SingleTurnParams]

    def __init__(
        self,
        model: OllamaModel | None = None,
        threshold: float | None = None,
    ) -> None:
        self.model = model or OllamaModel(
            model=os.getenv("JUDGE_MODEL"),
            base_url=os.getenv("OLLAMA_URL"),
        )
        if threshold is not None:
            self.threshold = threshold

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
    def score(self) -> float:
        return self._metric.score

    @property
    def reason(self) -> str:
        return self._metric.reason

    @property
    def is_successful(self) -> bool:
        return self._metric.is_successful()

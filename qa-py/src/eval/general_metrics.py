from deepeval.test_case import SingleTurnParams

from src.eval.base import Metric


class ComplianceWithInstructions(Metric):
    name = "Compliance with Instructions"
    criteria = (
        "Determine whether “actual_output” accurately reflects the behaviour, "
        "role and restrictions described in “expected_output” for the user's “input”."
    )
    threshold = 0.5
    evaluation_params = [
        SingleTurnParams.INPUT,
        SingleTurnParams.ACTUAL_OUTPUT,
        SingleTurnParams.EXPECTED_OUTPUT,
    ]

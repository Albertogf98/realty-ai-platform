from deepeval.test_case import SingleTurnParams

# Shared metric definitions. Each spec is a dict of RagMetrics constructor args.
# Add a new dict here and every eval test parametrized over `metric` picks it up.

METRIC_SPECS = [
    {
        "name": "Compliance with Instructions",
        "criteria": (
            "Determine whether “actual_output” accurately reflects the behaviour, "
            "role and restrictions described in “expected_output” for the user's “input”."
        ),
        "evaluation_params": [
            SingleTurnParams.INPUT,
            SingleTurnParams.ACTUAL_OUTPUT,
            SingleTurnParams.EXPECTED_OUTPUT,
        ],
        "threshold": 0.5,
    },
]

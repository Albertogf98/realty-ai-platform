from pathlib import Path
from dotenv import load_dotenv
from src.api.api_helper import APIHelper
import pytest

load_dotenv(Path(__file__).resolve().parents[1] / ".env", override=False)

@pytest.fixture(scope="session")
def api_helper():
    helper = APIHelper()

    try:
        yield helper
    finally:
        helper.close()


@pytest.fixture(scope="session")
def api(api_helper):
    return api_helper.api
import pytest
import os

from typing import Generator, Callable
from pathlib import Path
from dotenv import load_dotenv
from src.api.api_helper import APIHelper
from playwright.sync_api import Playwright, APIRequestContext, Page

from src.pages.login_page import LoginPage
from src.pages.cookies_modal_page import CookieModalPage

from src.eval.deepeval_metrics import RagMetrics
from src.eval.metric_specs import METRIC_SPECS

from deepeval.models.llms import OllamaModel

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

@pytest.fixture(scope="session")
def api_request_context(
    playwright: Playwright,
) -> Generator[APIRequestContext, None, None]:
    request_context = playwright.request.new_context(base_url=os.getenv("API_URL"))
    yield request_context
    request_context.dispose()

@pytest.fixture
def cookies_modal_page(page: Page) -> CookieModalPage:
    return CookieModalPage(page)

@pytest.fixture
def login_as(page: Page, cookies_modal_page: CookieModalPage) -> Callable[[str, str], LoginPage]:
    def _login(email: str, password: str) -> LoginPage:
        login_pg = LoginPage(page)
        login_pg.navigate_to()

        cookies_modal_page.accept_cookies()

        login_pg.login({"email": email, "password": password})
        
        return login_pg

    return _login

@pytest.fixture(params=METRIC_SPECS, ids=[spec["name"] for spec in METRIC_SPECS])
def metric(request) -> RagMetrics:
    return RagMetrics(**request.param)

@pytest.fixture(scope="session")
def ollama_judge() -> OllamaModel:
    return OllamaModel(
        model=os.getenv("JUDGE_MODEL"),
        base_url=os.getenv("OLLAMA_URL"),
    )

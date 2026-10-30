import os

import httpx

class APIHelper:
    def __init__(self,api_url: str | None = None, timeout: float | None = None) -> None:
        self.api_url = api_url or os.getenv("API_URL")
        self.timeout = (
            timeout
            if timeout is not None
            else float(os.getenv("REQUEST_TIMEOUT_S", "30"))
        )
        self.client = httpx.Client(base_url=self.api_url, timeout=self.timeout, follow_redirects=True)

    def ask(self, question: str) -> str:
        response = self.client.post("/ollama/ask", json={"question": question})
        response.raise_for_status()
        content_type = response.headers.get("content-type", "")
      
        if "application/json" in content_type:
            return response.json()
        
        return response.text

    def search_properties(self, question: str) -> dict:
        """Ask the RAG endpoint; returns {answer, filters, properties}."""
        response = self.client.post(
            "/ollama/search-properties",
            json={"question": question},
        )
        response.raise_for_status()
        return response.json()

    def close(self) -> None:
        self.client.close()

    @property
    def api(self):
        return self.client

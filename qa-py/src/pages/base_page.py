from playwright.sync_api import Page, Response, Locator

class BasePage: 
    def __init__(self, page: Page) -> None:
        self.page = page

    def navigate_to(self, url: str) -> Response | None: 
        return self.page.goto(url)

    def locator(self, locator: str) -> Locator:
        if not locator:
            raise ValueError("Locator is not defined")
        
        return self.page.locator(locator)

    def get_locator_by_id(self, test_id: str) -> Locator: 
         if not id:
            raise ValueError("Id is not defined")

         return self.page.get_by_test_id(test_id)

    def fill_input(self, locator: Locator, text: str) -> None:
        locator.fill(value=text)

    def click(self, locator: Locator) -> None:
        locator.click()
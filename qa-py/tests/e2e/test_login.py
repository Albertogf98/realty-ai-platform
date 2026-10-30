import os
import re
#pytest test_login.py -v --headed

from playwright.sync_api import expect

def test_should_login_with_correct_credentials(login_as) -> None:
    login_page = login_as(os.getenv("ADMIN_EMAIL"), os.getenv("ADMIN_PASSWORD"))
    expect(login_page.page).to_have_url(re.compile(r"es/"))
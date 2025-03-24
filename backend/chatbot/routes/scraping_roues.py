import os
from fastapi import APIRouter
from fastapi.responses import StreamingResponse
from playwright.sync_api import sync_playwright, TimeoutError
from playwright_stealth import stealth_sync  # Import stealth
from dotenv import load_dotenv
import time

load_dotenv()

router = APIRouter()

@router.get("/scrape-course-content")
def scrape_bioxel():
    login_email = os.environ.get("LOGIN_EMAIL", "")
    login_password = os.environ.get("LOGIN_PASSWORD", "")
    if not login_email or not login_password:
        return {"error": "Environment variables LOGIN_EMAIL and LOGIN_PASSWORD must be set."}

    def scrape_generator():
        # This variable will accumulate all scraped topics.
        all_content = ""
        yield "Starting scraping...\n"
        with sync_playwright() as p:
            browser = p.chromium.launch(headless=False)  # headless=True for production
            context = browser.new_context()
            page = context.new_page()
            stealth_sync(page)  # Apply stealth to the main page

            print("Navigating to course page...\n")
            yield "Navigating to course page...\n"
            try:
                page.goto(
                    "https://edu.metrum.com.pl/courses/laseroterapia-podstawy/",
                    timeout=60000,
                    wait_until="domcontentloaded"
                )
            except TimeoutError:
                print("Initial page load timed out. Retrying with extended timeout...\n")
                yield "Initial page load timed out. Retrying with extended timeout...\n"
                page.goto(
                    "https://edu.metrum.com.pl/courses/laseroterapia-podstawy/",
                    timeout=90000,
                    wait_until="domcontentloaded"
                )
            page.wait_for_load_state("networkidle")

            # Click on "Zaloguj się" button
            print("Clicking login button...\n")
            yield "Clicking login button...\n"
            page.wait_for_selector("li#menu-item-1245 a.menu-link")
            page.click("li#menu-item-1245 a.menu-link")

            # Wait for login form and fill credentials
            print("Filling in credentials...\n")
            yield "Filling in credentials...\n"
            page.wait_for_selector("form#loginform")
            page.fill("input#user_login", login_email)
            page.fill("input#user_pass", login_password)

            # Click the login button and wait for navigation
            page.click("input#wp-submit")
            page.wait_for_load_state("networkidle")
            print("Logged in successfully.\n")
            yield "Logged in successfully.\n"

            # Expand all course sections/topics if available
            try:
                page.wait_for_selector("button.ld-expand-button.ld-primary-background", timeout=5000)
                page.click("button.ld-expand-button.ld-primary-background")
                print("Expanded course topics.\n")
                yield "Expanded course topics.\n"
            except TimeoutError:
                print("No expand button found.\n")
                yield "No expand button found.\n"

            # -------------------------------
            # Collect all lesson/topic links:
            # -------------------------------
            #  a.ld-item-name  = "lessons" not in table-lists
            #  a.ld-table-list-item-preview = "topics" in table-lists
            # We combine them with a comma selector to get both:
            all_anchors = page.locator("a.ld-item-name, a.ld-table-list-item-preview")
            anchor_count = all_anchors.count()
            info_msg = f"Found {anchor_count} lessons/topics.\n\n"
            print(info_msg)
            yield info_msg

            # Visit each link and scrape content
            for i in range(anchor_count):
                anchor = all_anchors.nth(i)
                href = anchor.get_attribute("href")
                if not href:
                    msg = f"Item {i+1}: No href found, skipping.\n"
                    print(msg)
                    yield msg
                    continue

                msg = f"Processing item {i+1} at {href}\n"
                print(msg)
                yield msg

                # Open detail page in a new tab
                detail_page = context.new_page()
                stealth_sync(detail_page)  # Apply stealth to the detail page
                try:
                    detail_page.goto(href, timeout=60000, wait_until="domcontentloaded")
                except TimeoutError:
                    msg = f"Detail page {href} load timed out, retrying with extended timeout...\n"
                    print(msg)
                    yield msg
                    detail_page.goto(href, timeout=90000, wait_until="domcontentloaded")

                detail_page.wait_for_load_state("networkidle")
                time.sleep(2)  # Extra wait for lazy-loading

                # Extract content using a generic approach.
                try:
                    text_content = detail_page.evaluate('''() => {
                        let container = document.querySelector('div.ld-focus-content');
                        if (container) {
                            const removeSelectors = ['header', 'footer', 'nav', 'aside'];
                            removeSelectors.forEach(sel => {
                                container.querySelectorAll(sel).forEach(el => el.remove());
                            });
                            return container.innerText.trim();
                        } else {
                            let bodyClone = document.body.cloneNode(true);
                            const removeSelectors = ['header', 'footer', 'nav', 'aside', 'script', 'style', 'noscript'];
                            removeSelectors.forEach(sel => {
                                bodyClone.querySelectorAll(sel).forEach(el => el.remove());
                            });
                            return bodyClone.innerText.trim();
                        }
                    }''')
                except Exception as e:
                    err_msg = f"Error extracting text: {e}\n"
                    print(err_msg)
                    yield err_msg
                    text_content = ""

                # Extract the title (using the first <h1> element if present)
                try:
                    title = detail_page.locator("h1").inner_text().strip()
                except Exception:
                    title = "No title found"

                # Format this topic's data
                formatted_topic = (
                    f"Title: {title}\n"
                    f"URL: {href}\n"
                    "Content:\n"
                    f"{text_content}\n"
                    f"{'-'*40}\n\n"
                )
                all_content += formatted_topic

                # Optional: log preview
                content_preview = text_content[:200] if text_content else "(empty)"
                print(
                    f"Title: {title}\n"
                    f"Extracted content length: {len(text_content)}\n"
                    f"Content (first 200 chars): {content_preview}\n"
                    "-----\n"
                )

                detail_page.close()

            browser.close()

        # Write all collected content to a single text file.
        file_path = "scraped_course_content.txt"
        with open(file_path, "w", encoding="utf-8") as f:
            f.write(all_content)
        final_msg = f"Scraping complete. Data stored in {file_path}\n"
        print(final_msg)
        yield final_msg

    return StreamingResponse(scrape_generator(), media_type="text/plain")

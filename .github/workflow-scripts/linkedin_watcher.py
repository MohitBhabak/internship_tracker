"""Poll LinkedIn public guest job search API for new US Product Management,
TPM, Project Management, and Operations intern roles and emit an email alert via SMTP.

Postings on LinkedIn guest search API are public, real-time, and require zero authentication.
State is saved in snapshots/linkedin-seen.json.
"""

import html
import json
import os
import re
import sys
import urllib.parse
import urllib.request
from concurrent.futures import ThreadPoolExecutor, as_completed
from pathlib import Path

from job_filters import is_us, wanted_title
from notifier import send_email

SCRIPT_DIR = Path(__file__).resolve().parent
SEEN_PATH = Path("snapshots/linkedin-seen.json")

TAG_RE = re.compile(r"<[^>]+>")
WHITESPACE_RE = re.compile(r"\s+")

HEADERS = {
    "User-Agent": (
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) "
        "AppleWebKit/537.36 (KHTML, like Gecko) "
        "Chrome/120.0.0.0 Safari/537.36"
    )
}

SEARCH_QUERIES = [
    "Product Management Intern",
    "Product Manager Intern",
    "Technical Program Manager Intern",
    "Project Management Intern",
    "Operations Intern",
    "Business Operations Intern",
]


def clean_text(raw: str) -> str:
    s = TAG_RE.sub("", raw)
    s = html.unescape(s)
    return WHITESPACE_RE.sub(" ", s).strip()


def search_linkedin_query(query: str) -> list:
    """Fetch recent US job postings for a single search query on LinkedIn."""
    # f_TPR=r86400 restricts search to roles posted within the last 24 hours
    url = (
        "https://www.linkedin.com/jobs-guest/jobs/api/seeMoreJobPostings/search?"
        f"keywords={urllib.parse.quote(query)}&location=United+States&f_TPR=r86400&start=0"
    )
    jobs = []
    try:
        req = urllib.request.Request(url, headers=HEADERS)
        with urllib.request.urlopen(req, timeout=15) as resp:
            content = resp.read().decode("utf-8", errors="replace")
            cards = content.split("<li")
            for c in cards[1:]:
                m_title = re.search(
                    r"<h3[^>]*class=\"[^\"]*base-search-card__title[^\"]*\"[^>]*>(.*?)</h3>",
                    c,
                    re.DOTALL,
                )
                m_company = re.search(
                    r"<h4[^>]*class=\"[^\"]*base-search-card__subtitle[^\"]*\"[^>]*>(.*?)</h4>",
                    c,
                    re.DOTALL,
                )
                m_loc = re.search(
                    r"<span[^>]*class=\"[^\"]*job-search-card__location[^\"]*\"[^>]*>(.*?)</span>",
                    c,
                    re.DOTALL,
                )
                m_link = re.search(
                    r"<a[^>]*class=\"[^\"]*base-card__full-link[^\"]*\"[^>]*href=\"([^\"]+)\"",
                    c,
                    re.DOTALL,
                )

                if m_title and m_company and m_link:
                    title = clean_text(m_title.group(1))
                    company = clean_text(m_company.group(1))
                    location = clean_text(m_loc.group(1)) if m_loc else ""
                    raw_link = m_link.group(1)
                    clean_link = raw_link.split("?")[0]

                    m_id = re.search(r"-(\d{8,12})(?:\Z|/|\?)", clean_link)
                    job_id = f"li:{m_id.group(1)}" if m_id else f"li:{clean_link}"

                    if wanted_title(title) and is_us(location):
                        jobs.append(
                            {
                                "id": job_id,
                                "company": company,
                                "title": title,
                                "location": location,
                                "url": clean_link,
                            }
                        )
    except Exception as e:
        print(f"WARN: LinkedIn search query {query!r} failed: {e}", file=sys.stderr)
    return jobs


def collect_matches() -> list:
    all_jobs = []
    with ThreadPoolExecutor(max_workers=6) as pool:
        futures = {pool.submit(search_linkedin_query, q): q for q in SEARCH_QUERIES}
        for fut in as_completed(futures):
            all_jobs.extend(fut.result())

    # Deduplicate by job ID
    deduped = {}
    for j in all_jobs:
        if j["id"] not in deduped:
            deduped[j["id"]] = j
    return sorted(deduped.values(), key=lambda j: (j["company"].lower(), j["title"].lower()))


def get_logs_url() -> str:
    repo = os.environ.get("GITHUB_REPOSITORY")
    server = os.environ.get("GITHUB_SERVER_URL", "https://github.com")
    if repo:
        return f"{server}/{repo}/actions"
    return "https://github.com"


def render_html(items: list) -> str:
    rows = []
    for it in items:
        rows.append(
            '<tr>'
            '<td style="padding:10px 0;border-bottom:1px solid #eee;vertical-align:top;">'
            f'<div style="font-weight:600;font-size:14px;color:#111;">'
            f'{html.escape(it["company"])}</div>'
            f'<div style="font-size:14px;color:#333;margin-top:2px;">'
            f'{html.escape(it["title"])}</div>'
            f'<div style="font-size:12px;color:#666;margin-top:2px;">'
            f'{html.escape(it["location"] or "Location not listed")}</div>'
            '</td>'
            '<td style="padding:10px 0;border-bottom:1px solid #eee;'
            'vertical-align:middle;text-align:right;white-space:nowrap;">'
            f'<a href="{html.escape(it["url"])}" '
            f'style="display:inline-block;padding:6px 14px;background:#0a66c2;'
            f'color:#fff;text-decoration:none;border-radius:4px;font-size:13px;'
            f'font-weight:600;">View on LinkedIn</a>'
            '</td>'
            '</tr>'
        )
    return (
        '<html><body style="font-family:-apple-system,BlinkMacSystemFont,'
        '\'Segoe UI\',Roboto,sans-serif;background:#f7f7f7;margin:0;padding:20px;">'
        '<div style="max-width:640px;margin:0 auto;background:#fff;padding:24px;'
        'border-radius:8px;box-shadow:0 1px 3px rgba(0,0,0,0.08);">'
        f'<h1 style="font-size:18px;margin:0 0 4px;color:#111;">'
        f'{len(items)} new PM / TPM / Project / Ops intern role{"s" if len(items) != 1 else ""} on LinkedIn</h1>'
        '<p style="font-size:12px;color:#888;margin:0 0 8px;">'
        'US Product Management, TPM, Project Management, and Operations internships — '
        'sourced directly from LinkedIn guest job search.</p>'
        '<table cellpadding="0" cellspacing="0" border="0" '
        'style="width:100%;border-collapse:collapse;">'
        + "\n".join(rows) +
        '</table>'
        '<hr style="border:0;border-top:1px solid #eee;margin:20px 0 8px;">'
        '<p style="color:#aaa;font-size:11px;margin:0;">'
        'Sent by internship-watcher (LinkedIn) · '
        f'<a href="{get_logs_url()}" '
        'style="color:#aaa;">workflow logs</a></p>'
        '</div></body></html>'
    )


def render_plain(items: list) -> str:
    lines = [f"{len(items)} new PM / TPM / Project / Ops intern role(s) on LinkedIn", ""]
    for it in items:
        lines.append(f"  {it['company']} - {it['title']}")
        lines.append(f"    Location: {it['location'] or '(not listed)'}")
        lines.append(f"    Link: {it['url']}")
    return "\n".join(lines)


def build_subject(items: list) -> str:
    if not items:
        return "No new LinkedIn intern roles"
    unique = list(dict.fromkeys(it["company"] for it in items))
    preview = ", ".join(unique[:3])
    suffix = f" +{len(unique) - 3} more" if len(unique) > 3 else ""
    plural = "s" if len(items) != 1 else ""
    return f"{len(items)} new PM/TPM/Ops intern role{plural} (LinkedIn): {preview}{suffix}"


def main():
    matches = collect_matches()

    first_run = not SEEN_PATH.exists()
    seen = set()
    if not first_run:
        try:
            seen = set(json.loads(SEEN_PATH.read_text(encoding="utf-8")))
        except (ValueError, OSError):
            first_run = True

    new = []
    for it in matches:
        if it["id"] not in seen:
            new.append(it)
            seen.add(it["id"])

    SEEN_PATH.parent.mkdir(exist_ok=True)
    SEEN_PATH.write_text(
        json.dumps(sorted(seen), indent=0) + "\n", encoding="utf-8"
    )

    if first_run:
        # Initial seeding: save current state without emailing to establish baseline
        new = []

    print(f"LinkedIn Matches: {len(matches)}, New: {len(new)}, first_run={'yes' if first_run else 'no'}")

    total = len(new)
    subject = build_subject(new)
    html_body = render_html(new)
    plain_body = render_plain(new)

    if total > 0:
        send_email(subject, html_body, plain_body, from_name="Internship Watcher (LinkedIn)")
    else:
        print("No new LinkedIn postings; skipping email.")


if __name__ == "__main__":
    main()

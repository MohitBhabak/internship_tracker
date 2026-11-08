"""Poll Workday career portals for new US & Canadian Product Management,
TPM, Project Management, and Operations intern and co-op postings and emit email alerts.

Queries Workday CXS (Candidate Experience Services) REST API across verified
enterprise companies. State is tracked in snapshots/workday-seen.json.
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

from job_filters import is_us_or_canada, wanted_title
from notifier import send_email

SCRIPT_DIR = Path(__file__).resolve().parent
COMPANIES_PATH = SCRIPT_DIR / "workday_companies.json"
SEEN_PATH = Path("snapshots/workday-seen.json")

WHITESPACE_RE = re.compile(r"\s+")

HEADERS_BASE = {
    "Accept": "application/json",
    "Accept-Language": "en-US,en;q=0.9",
    "Content-Type": "application/json",
    "User-Agent": (
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
        "AppleWebKit/537.36 (KHTML, like Gecko) "
        "Chrome/120.0.0.0 Safari/537.36"
    ),
}

SEARCH_TERMS = ["intern", "co-op"]


def fetch_workday_company(company: dict) -> list:
    """Fetch matching intern/co-op jobs for a single Workday company."""
    name = company["name"]
    domain = company["domain"]
    tenant = company["tenant"]
    site = company["site"]

    api_url = f"https://{domain}/wday/cxs/{tenant}/{site}/jobs"
    headers = dict(HEADERS_BASE)
    headers["Origin"] = f"https://{domain}"

    company_jobs = []
    seen_paths = set()

    for term in SEARCH_TERMS:
        payload = json.dumps(
            {"appliedFacets": {}, "limit": 20, "offset": 0, "searchText": term}
        ).encode("utf-8")
        req = urllib.request.Request(api_url, data=payload, headers=headers, method="POST")
        try:
            with urllib.request.urlopen(req, timeout=8) as resp:
                data = json.loads(resp.read().decode("utf-8"))
                for posting in data.get("jobPostings", []):
                    ext_path = posting.get("externalPath", "")
                    if not ext_path or ext_path in seen_paths:
                        continue
                    seen_paths.add(ext_path)

                    title = posting.get("title", "").strip()
                    location = posting.get("locationsText", "").strip()
                    posted_on = posting.get("postedOn", "").strip()
                    clean_url = f"https://{domain}/en-US/{site}{ext_path}"

                    # Unique persistent ID for Workday postings
                    job_id = f"wd:{domain}:{ext_path.lstrip('/')}"

                    if wanted_title(title) and is_us_or_canada(location):
                        company_jobs.append(
                            {
                                "id": job_id,
                                "company": name,
                                "title": title,
                                "location": location,
                                "url": clean_url,
                                "posted_on": posted_on,
                            }
                        )
        except Exception as e:
            # Individual company failure shouldn't abort the entire run
            print(f"WARN: Workday fetch {name} ({term!r}) failed: {e}", file=sys.stderr)

    return company_jobs


def collect_matches() -> list:
    if not COMPANIES_PATH.exists():
        print(f"ERROR: {COMPANIES_PATH} not found", file=sys.stderr)
        return []

    companies = json.loads(COMPANIES_PATH.read_text(encoding="utf-8"))
    all_jobs = []

    with ThreadPoolExecutor(max_workers=16) as pool:
        futures = {pool.submit(fetch_workday_company, c): c["name"] for c in companies}
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
            f'style="display:inline-block;padding:6px 14px;background:#005cb9;'
            f'color:#fff;text-decoration:none;border-radius:4px;font-size:13px;'
            f'font-weight:600;">Apply on Workday</a>'
            '</td>'
            '</tr>'
        )
    return (
        '<html><body style="font-family:-apple-system,BlinkMacSystemFont,'
        '\'Segoe UI\',Roboto,sans-serif;background:#f7f7f7;margin:0;padding:20px;">'
        '<div style="max-width:640px;margin:0 auto;background:#fff;padding:24px;'
        'border-radius:8px;box-shadow:0 1px 3px rgba(0,0,0,0.08);">'
        f'<h1 style="font-size:18px;margin:0 0 4px;color:#111;">'
        f'{len(items)} new PM / TPM / Project / Ops intern role{"s" if len(items) != 1 else ""} on Workday</h1>'
        '<p style="font-size:12px;color:#888;margin:0 0 8px;">'
        'US &amp; Canada Product Management, TPM, Project Management, and Operations internships / co-ops — '
        'sourced directly from Workday enterprise portals.</p>'
        '<table cellpadding="0" cellspacing="0" border="0" '
        'style="width:100%;border-collapse:collapse;">'
        + "\n".join(rows) +
        '</table>'
        '<hr style="border:0;border-top:1px solid #eee;margin:20px 0 8px;">'
        '<p style="color:#aaa;font-size:11px;margin:0;">'
        'Sent by internship-watcher (Workday) · '
        f'<a href="{get_logs_url()}" '
        'style="color:#aaa;">workflow logs</a></p>'
        '</div></body></html>'
    )


def render_plain(items: list) -> str:
    lines = [f"{len(items)} new PM / TPM / Project / Ops intern & co-op role(s) on Workday", ""]
    for it in items:
        lines.append(f"  {it['company']} - {it['title']}")
        lines.append(f"    Location: {it['location'] or '(not listed)'}")
        lines.append(f"    Link: {it['url']}")
    return "\n".join(lines)


def build_subject(items: list) -> str:
    if not items:
        return "No new Workday intern roles"
    unique = list(dict.fromkeys(it["company"] for it in items))
    preview = ", ".join(unique[:3])
    suffix = f" +{len(unique) - 3} more" if len(unique) > 3 else ""
    plural = "s" if len(items) != 1 else ""
    return f"{len(items)} new PM/TPM/Ops intern role{plural} (Workday): {preview}{suffix}"


def main():
    matches = collect_matches()

    first_run = not SEEN_PATH.exists()
    seen = set()
    if not first_run:
        try:
            seen = set(json.loads(SEEN_PATH.read_text(encoding="utf-8")))
            if not seen:
                first_run = True
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
        print(f"First run baseline seeded: {len(matches)} active Workday listings saved.")
        new = []

    print(f"Workday Matches: {len(matches)}, New: {len(new)}, first_run={'yes' if first_run else 'no'}")

    total = len(new)
    subject = build_subject(new)
    html_body = render_html(new)
    plain_body = render_plain(new)

    if total > 0:
        send_email(
            subject,
            html_body,
            plain_body,
            from_name="Internship Watcher (Workday)",
            items=new,
            source="Workday",
        )
    else:
        print("No new Workday postings; skipping email.")


if __name__ == "__main__":
    main()

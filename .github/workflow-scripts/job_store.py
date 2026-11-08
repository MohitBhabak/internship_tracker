"""Job store utility for persisting and updating discovered internship postings.

Writes to data/jobs.json for consumption by the Next.js Vercel dashboard.
"""

from datetime import datetime, timezone, timedelta
import json
from pathlib import Path
import re

from job_filters import CANADA_HINT_RE, OPERATIONS_RE, US_HINT_RE

REPO_ROOT = Path(__file__).resolve().parent.parent.parent
DATA_DIR = REPO_ROOT / "data"
DATA_FILE = DATA_DIR / "jobs.json"


def parse_relative_age_to_iso(age_str: str) -> str:
    now = datetime.now(timezone.utc)
    if not age_str:
        return (now - timedelta(days=14)).isoformat()
    s = age_str.strip().lower()
    if any(x in s for x in ("today", "0d", "0h", "just now", "few hours")):
        return now.isoformat()
    if "yesterday" in s or s == "1d":
        return (now - timedelta(days=1)).isoformat()
    m = re.search(r"(\d+)\s*d", s)
    if m:
        return (now - timedelta(days=int(m.group(1)))).isoformat()
    m = re.search(r"(\d+)\s*w", s)
    if m:
        return (now - timedelta(weeks=int(m.group(1)))).isoformat()
    m = re.search(r"(\d+)\s*mo", s)
    if m:
        return (now - timedelta(days=int(m.group(1)) * 30)).isoformat()
    return (now - timedelta(days=14)).isoformat()


def get_category(title: str) -> str:
    t = title.lower()
    if re.search(r"\btechnical program\b|\btpm\b", t):
        return "Technical Program Management (TPM)"
    if re.search(r"\bproject\b|\bprogram coordinator\b", t):
        return "Project Management"
    if re.search(r"\bproduct\b|\bapm\b", t):
        return "Product Management (PM)"
    if OPERATIONS_RE.search(title):
        return "Operations"
    return "Other"


def get_country(location: str) -> str:
    if not location:
        return "Remote / Flexible"
    if CANADA_HINT_RE.search(location):
        return "Canada"
    if US_HINT_RE.search(location):
        return "United States"
    return "Remote / Flexible"


def record_jobs(items: list, source: str) -> int:
    """Record or update a list of job items in data/jobs.json.

    Preserves original first_seen timestamps so existing jobs do not
    reset their discovery date on subsequent runs.
    """
    DATA_DIR.mkdir(parents=True, exist_ok=True)

    existing_jobs = {}
    if DATA_FILE.exists():
        try:
            raw = json.loads(DATA_FILE.read_text(encoding="utf-8"))
            if isinstance(raw, list):
                for j in raw:
                    if "id" in j:
                        existing_jobs[j["id"]] = j
        except Exception:
            existing_jobs = {}

    now_iso = datetime.now(timezone.utc).isoformat()
    added_count = 0

    for it in items:
        jid = it.get("id")
        title = (it.get("title") or it.get("role") or "").strip()
        company = it.get("company", "").strip()
        location = it.get("location", "").strip()
        url = (it.get("url") or it.get("apply_url") or "").strip()

        if not jid:
            jid = f"{source.lower()}:{company}:{title}:{location}".lower()

        if not title or not company:
            continue

        if jid in existing_jobs:
            existing = existing_jobs[jid]
            existing["last_seen"] = now_iso
            if url and not existing.get("url"):
                existing["url"] = url
            if location and not existing.get("location"):
                existing["location"] = location
        else:
            first_seen = it.get("first_seen") or now_iso
            posted_at = it.get("posted_at")
            posted_on = it.get("posted_on") or it.get("age")
            if not it.get("first_seen"):
                if posted_at:
                    try:
                        if "T" not in posted_at:
                            first_seen = f"{posted_at}T12:00:00+00:00"
                        else:
                            first_seen = posted_at
                    except Exception:
                        first_seen = now_iso
                elif posted_on:
                    first_seen = parse_relative_age_to_iso(posted_on)

            existing_jobs[jid] = {
                "id": jid,
                "company": company,
                "title": title,
                "location": location,
                "url": url,
                "source": source,
                "category": get_category(title),
                "country": get_country(location),
                "first_seen": first_seen,
                "last_seen": now_iso,
            }
            added_count += 1

    # Sort by first_seen descending (newest first)
    sorted_jobs = sorted(
        existing_jobs.values(),
        key=lambda x: (x.get("first_seen", ""), x.get("last_seen", "")),
        reverse=True,
    )

    # Keep up to 1000 recent jobs
    sorted_jobs = sorted_jobs[:1000]

    DATA_FILE.write_text(
        json.dumps(sorted_jobs, indent=2, ensure_ascii=False) + "\n",
        encoding="utf-8",
    )
    return added_count


def record_emailed_jobs(items: list, source: str) -> int:
    """Record listings that are dispatched in an email alert into the dashboard feed.

    This ensures that the dashboard receives the exact same postings as the emails,
    through the same funnel.
    """
    if not items:
        return 0
    return record_jobs(items, source)

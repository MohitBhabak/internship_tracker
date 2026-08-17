# 🎯 Internship Tracker & Watcher (PM · TPM · Project · Ops)

An automated, high-frequency tracking engine for **Product Management (PM/APM)**, **Technical Program Management (TPM)**, **Project Management**, and **Operations (BizOps, TechOps, Strategy & Ops)** internships.

It monitors both SimplifyJobs repository boards and direct company ATS portals (Greenhouse, Lever, Ashby) to send instantaneous, deduplicated email alerts when new roles open.

---

## ⚡ Features

- **Dual-Engine Detection**:
  - **SimplifyJobs Board Watcher**: Monitors curated Summer and Off-season internship tables via authenticated GitHub API across all relevant categories.
  - **Direct ATS Watcher**: Directly queries 100+ top company ATS endpoints (Ashby, Greenhouse, Lever) in parallel to detect job postings before aggregator boards catch them.
- **Intelligent Filtering (`job_filters.py`)**:
  - Targets Product Management (PM, APM, Product Strategy, Product Operations, Product Analyst).
  - Targets Technical Program Management (TPM, Program Management).
  - Targets Project Management (Project Manager, Project Coordinator, Project Lead).
  - Targets Operations (Business Operations, BizOps, TechOps, Strategy & Operations, Operations Analyst).
  - Disqualifies pure software engineering, hardware engineering, data science, sales, and non-relevant roles.
  - Retains US-based and US-remote eligible roles.
- **Smart Deduplication**:
  - Maintains state snapshots (`snapshots/`) across runs so you are never emailed about the same role twice, even if reposted under new IDs or across multiple boards.
- **Rich Email Alerts**:
  - Sends clean, mobile-responsive HTML and plaintext emails with one-click direct application links.
- **Atomic Workflow State**:
  - Built-in retry/rebase synchronization to avoid GitHub Actions concurrency conflicts.

---

## 🚀 Setup Guide: Make It Yours

Follow these steps to deploy this tracker to your own GitHub account:

### 1. Connect to Your Own GitHub Repository

If you haven't created a GitHub repository yet:
1. Go to [GitHub New Repository](https://github.com/new) and create a repository (e.g. `Internship_Tracker` or `internship-watcher`).
2. Update your local git remote and push:

```bash
# Remove the template origin
git remote remove origin

# Add your own repository as origin
git remote add origin https://github.com/<YOUR_GITHUB_USERNAME>/<YOUR_REPO_NAME>.git

# Push to your repository
git branch -M main
git push -u origin main
```

---

### 2. Enable GitHub Actions Write Permissions

The workflow needs permission to commit snapshot state files back to the repository:

1. In your GitHub repository, navigate to **Settings** > **Actions** > **General**.
2. Scroll to **Workflow permissions**.
3. Select **Read and write permissions**.
4. Check **Allow GitHub Actions to create and approve pull requests**.
5. Click **Save**.

---

### 3. Add Email Secrets

The notification system uses Gmail SMTP by default.

#### Generate a Gmail App Password:
1. Go to your **[Google Account Security](https://myaccount.google.com/security)**.
2. Ensure **2-Step Verification** is turned on.
3. Search for **App passwords** (or go to [App passwords](https://myaccount.google.com/apppasswords)).
4. Create a new app password named `Internship Tracker`.
5. Copy the generated 16-character password.

#### Add Secrets to GitHub:
1. In your repository, go to **Settings** > **Secrets and variables** > **Actions**.
2. Click **New repository secret** and add the following:

| Secret Name | Description | Example |
|---|---|---|
| `MAIL_USERNAME` | Your Gmail address | `yourname@gmail.com` |
| `MAIL_PASSWORD` | The 16-character Gmail App Password | `abcd efgh ijkl mnop` |
| `MAIL_TO` | Email address where alerts should be sent | `yourname@gmail.com` |

---

### 4. Test the Workflow

1. In your repository, go to the **Actions** tab.
2. Select **Internship Watcher** from the left sidebar.
3. Click **Run workflow** > **Run workflow**.
4. Inspect the run logs to verify execution.

---

### 5. High-Frequency Polling (Optional but Recommended)

GitHub's native cron schedule (`schedule: - cron: '*/15 * * * *'`) runs as a background backstop, but GitHub scheduled events can experience queue delays during peak hours.

To ensure fast alerts (every 5–15 minutes):
1. Create a free account at [cron-job.org](https://cron-job.org).
2. Generate a [GitHub Personal Access Token (classic or fine-grained)](https://github.com/settings/tokens) with `repo` / `actions:write` scope.
3. Create a cron job with:
   - **URL**: `https://api.github.com/repos/<YOUR_USERNAME>/<YOUR_REPO>/actions/workflows/watch.yml/dispatches`
   - **Method**: `POST`
   - **Headers**:
     - `Authorization`: `Bearer <YOUR_GITHUB_TOKEN>`
     - `Accept`: `application/vnd.github.v3+json`
     - `User-Agent`: `Internship-Watcher-Pinger`
   - **Request Body**: `{"ref": "main"}`
   - **Schedule**: Every 10 or 15 minutes.

---

## 🛠️ Customization

### Adding / Removing Companies
Edit `.github/workflow-scripts/ats_companies.json` to add target companies on Greenhouse, Lever, or Ashby:

```json
[
  {
    "ats": "greenhouse",
    "slug": "stripe",
    "name": "Stripe"
  },
  {
    "ats": "ashby",
    "slug": "openai",
    "name": "OpenAI"
  },
  {
    "ats": "lever",
    "slug": "palantir",
    "name": "Palantir"
  }
]
```

### Modifying Keywords & Location Filters
Edit `.github/workflow-scripts/job_filters.py` to customize:
- `ROLE_RE`: Included role titles (e.g. adding Data Engineering, Security, or Mobile if desired).
- `EXCLUDE_RE`: Excluded role types.
- `US_HINT_RE` / `NON_US_RE`: Location criteria.

---

## 📁 Repository Structure

```
.
├── .github/
│   ├── workflows/
│   │   └── watch.yml               # GitHub Actions pipeline definition
│   └── workflow-scripts/
│       ├── ats_companies.json      # List of 100+ monitored ATS company endpoints
│       ├── ats_watcher.py          # Parallel ATS poller (Greenhouse/Lever/Ashby)
│       ├── job_filters.py          # Regex filters for titles and locations
│       └── parse_boards.py         # SimplifyJobs board parser & deduplicator
├── snapshots/                      # State snapshots for change detection
│   ├── ats-seen.json
│   ├── previous-main.md
│   ├── previous-offseason.md
│   └── seen.json
├── .gitignore
└── README.md
```

---

## 📄 License

MIT License. Feel free to modify and adapt for your own job search!

# Zensical Git Revision Date Workflow

This guide documents a reusable workflow that emulates `mkdocs-git-revision-date-localized-plugin` behavior in Zensical by injecting git dates into Markdown front matter before build/serve.

## Why This Is Needed

A Python-Markdown extension can only transform Markdown content, not Jinja template files under `overrides/`.

If you put a token like `%%git_revision_date%%` inside a template partial (for example `overrides/partials/source-file.html`), it will not be replaced by a Markdown preprocessor.

The reliable approach is:

1. Compute per-page git dates for each Markdown file.
2. Write those values into front matter metadata keys.
3. Read those keys from the template.

## Metadata Keys Used

The injector writes these keys to each page front matter:

- `git_revision_date_localized`: date of most recent commit touching the file.
- `git_creation_date_localized`: date of first commit that added the file.
- `revision_date`: compatibility fallback equal to revision date.

Date format is `YYYY-MM-DD`.

## File Layout

Add or copy these files into your project:

- `md_git_date/injector.py`
- `md_git_date/cli.py`

Optional compatibility wrapper (helpful for humans/scripts that call a file path directly):

- `scripts/inject_git_revision_dates.py`

And add script entries in `pyproject.toml` under `[project.scripts]`:

```toml
[project.scripts]
inject-git-dates = "md_git_date.cli:inject_only"
site-build = "md_git_date.cli:build_site"
site-serve = "md_git_date.cli:serve_site"
```

## 1) Injector Script

Create `md_git_date/injector.py` with this behavior:

- Recursively scan `docs/**/*.md`.
- Read existing YAML front matter if present.
- For each file, run git commands:
  - revision: `git log -1 --format=%ct -- <file>`
  - creation: `git log -1 --diff-filter=A --follow --format=%ct -- <file>`
- Convert UNIX timestamps to `YYYY-MM-DD`.
- Upsert metadata keys.
- Support `--check` mode:
  - exit `0` when no changes needed
  - exit `1` when files would change

The current implementation in this repo is:

- `md_git_date/injector.py`

Compatibility wrapper:

- `scripts/inject_git_revision_dates.py` (thin wrapper that delegates to `md_git_date.injector`)

## 2) uv Entry Points That Always Run Injector First

Create `md_git_date/cli.py` with three entry functions:

- `inject_only()`: run injector only
- `build_site()`: run injector, then `zensical build`
- `serve_site()`: run injector, then `zensical serve`

Implementation note: `cli.py` should call `md_git_date.injector` directly (import + function call), not execute a repo-relative script path. This keeps the workflow portable across build backends and wheel installs.

The current implementation in this repo is:

- `md_git_date/cli.py`

Then configure `pyproject.toml`:

```toml
[project.scripts]
inject-git-dates = "md_git_date.cli:inject_only"
site-build = "md_git_date.cli:build_site"
site-serve = "md_git_date.cli:serve_site"
```

## 3) Template Rendering

Read page metadata in your template partial (for example `overrides/partials/source-file.html`):

```jinja2
{% if page.meta %}
  {% if page.meta.git_revision_date_localized %}
    {% set updated = page.meta.git_revision_date_localized %}
  {% elif page.meta.revision_date %}
    {% set updated = page.meta.revision_date %}
  {% endif %}
{% endif %}

{% if updated %}
  <span class="md-source-file__fact">Last updated: {{ render_updated(updated) }}</span>
{% endif %}
```

Important: do not use raw replacement tokens in Jinja partials.

## 3.1) Shared Partial Pattern (Recommended)

If you maintain custom templates (for example a `courses.html` layout), keep git-date rendering in one shared partial so every page path stays consistent.

Recommended structure:

- `overrides/partials/content.html`: canonical content partial that includes `partials/source-file.html`.
- `overrides/partials/courses_content.html`: thin wrapper that includes `partials/content.html`.

Example wrapper:

```jinja2
{% include "partials/content.html" %}
```

This avoids a common regression where only one template variant shows "Last updated" while other pages silently lose it.

## 4) Recommended Commands

Use these commands instead of direct `uv run zensical ...`:

```bash
uv run site-build
uv run site-serve
```

Other useful commands:

```bash
uv run inject-git-dates
uv run inject-git-dates --check
```

## 5) Behavior Notes

- `uv run zensical build` and `uv run zensical serve` bypass the injector.
- `uv run site-serve` runs the injector once at startup, then starts the dev server.
- If you need to refresh metadata while serve is already running, run `uv run inject-git-dates` in another terminal.
- Untracked files or files without git history will be skipped until they are committed.
- Revision-date selection ignores commits that only change these managed front matter keys: `git_revision_date_localized`, `git_creation_date_localized`, and `revision_date`.
- Result: date churn from injector-only commits does not advance "Last updated"; meaningful content/metadata edits still do.

## 5.1) Build Backend Compatibility (setuptools, Hatchling, etc.)

This workflow is backend-agnostic when you keep logic in importable package modules and wire commands through `[project.scripts]`.

For Hatchling, example `pyproject.toml` setup:

```toml
[build-system]
requires = ["hatchling"]
build-backend = "hatchling.build"

[project.scripts]
inject-git-dates = "md_git_date.cli:inject_only"
site-build = "md_git_date.cli:build_site"
site-serve = "md_git_date.cli:serve_site"

[tool.hatch.build.targets.wheel]
packages = ["md_git_date"]

[tool.hatch.build.targets.sdist]
include = [
  "md_git_date/**",
  "scripts/**",
  "docs/**",
  "overrides/**",
  "js/**",
  "zensical.toml",
  "pyproject.toml",
  "README.md",
  "LICENSE"
]
```

If `md_git_date` is omitted from wheel packaging, script entry points can resolve but fail at runtime due to missing import targets.

The explicit sdist include list keeps published source tarballs intentional and avoids bundling generated artifacts (for example `site/`). Tailor the `include` list to your own repository layout.

## 6) Validation Checklist

1. Run `uv run inject-git-dates --check` and confirm it exits `0` when clean.
2. Open a Markdown file and confirm front matter contains the three metadata keys.
3. Run `uv run site-build` and verify rendered pages show the updated date.
4. Confirm your template references `page.meta.git_revision_date_localized` (or fallback `revision_date`).

## 7) Porting To Another Zensical Site

1. Copy `md_git_date/injector.py`.
2. Copy `md_git_date/cli.py` (or equivalent module path).
3. Optionally copy `scripts/inject_git_revision_dates.py` wrapper.
4. Add `[project.scripts]` entries in `pyproject.toml`.
5. Ensure packaging includes `md_git_date` for your backend (setuptools/Hatchling/etc.).
6. Update your template partial to read metadata keys.
7. Use `uv run site-build` and `uv run site-serve` as your standard commands.

## 8) Optional Enhancements

- Add a CI step that runs `uv run inject-git-dates --check`.
- Add a pre-commit hook that runs `uv run inject-git-dates`.
- Add locale-aware date formatting in template logic if needed.

## Reference Files In This Repository

- `md_git_date/injector.py`
- `scripts/inject_git_revision_dates.py`
- `md_git_date/cli.py`
- `pyproject.toml`
- `overrides/partials/source-file.html`
- `README.md`

# CSUN English Graduate Program Website

Information will be added soon.

## Build With Git Revision Metadata

This repository includes a backend-agnostic pre-build injector that writes per-page git dates into Markdown front matter so template metadata fields are always available:

- `git_revision_date_localized`
- `git_creation_date_localized`
- `revision_date`

Run:

```bash
./scripts/build_site.sh
```

Or via `uv` script entry points (injector runs automatically first):

```bash
uv run site-build
uv run site-serve
```

If you only want to refresh metadata without building:

```bash
python3 scripts/inject_git_revision_dates.py
```

or

```bash
uv run inject-git-dates
```

### Build Backend Note

The `uv run site-build`, `uv run site-serve`, and `uv run inject-git-dates` commands are wired through `[project.scripts]` and continue to work when switching build backends (for example, setuptools to Hatchling), as long as the `md_git_date` package is included in your wheel build configuration.

This project also defines an explicit Hatchling sdist include list in `pyproject.toml` so source distributions only contain intended paths (and avoid shipping generated output like `site/`). Adjust the `include` list under `[tool.hatch.build.targets.sdist]` to match what you want to publish.

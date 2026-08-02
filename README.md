# CSUN English Graduate Program Website

Information will be added soon.

### Build Backend Note

The `uv run site-build`, `uv run site-serve`, and `uv run inject-git-dates` commands are wired through `[project.scripts]` and continue to work when switching build backends (for example, setuptools to Hatchling), as long as the `md_git_date` package is included in your wheel build configuration.

This project also defines an explicit Hatchling sdist include list in `pyproject.toml` so source distributions only contain intended paths (and avoid shipping generated output like `site/`). Adjust the `include` list under `[tool.hatch.build.targets.sdist]` to match what you want to publish.

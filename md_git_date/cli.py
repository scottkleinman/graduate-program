"""cli.py.

CLI entry points for injecting git metadata and running Zensical commands.
"""

from __future__ import annotations

import subprocess
import sys
from pathlib import Path

from md_git_date import injector


def _repo_root() -> Path:
    """Get the root of the git repository.


    Returns:
        The root of the git repository as a Path object.
    """
    return Path(__file__).resolve().parents[1]


def _run_injector() -> int:
    """Run the injector script.

    Returns:
        An exit code: 0 if successful, 1 if changes are needed in check mode
    """
    return injector.main([])


def _run_zensical(command: str) -> int:
    """Run a Zensical command in the repository root.

    Args:
        command: The Zensical command to run.

    Returns:
        The exit code of the command.
    """
    repo_root = _repo_root()
    cmd = ["zensical", command, *sys.argv[1:]]
    return subprocess.call(cmd, cwd=repo_root)


def inject_only() -> None:
    """Run the injector script only, without building or serving the site."""
    raise SystemExit(injector.main(sys.argv[1:]))


def build_site() -> None:
    """Run the injector script and then build the site using Zensical."""
    code = _run_injector()
    if code != 0:
        raise SystemExit(code)
    raise SystemExit(_run_zensical("build"))


def serve_site() -> None:
    """Run the injector script and then serve the site using Zensical."""
    code = _run_injector()
    if code != 0:
        raise SystemExit(code)
    raise SystemExit(_run_zensical("serve"))

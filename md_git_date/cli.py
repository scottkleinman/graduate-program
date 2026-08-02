"""CLI entry points for injecting git metadata and running Zensical commands."""

from __future__ import annotations

import subprocess
import sys
from pathlib import Path

from md_git_date import injector


def _repo_root() -> Path:
    return Path(__file__).resolve().parents[1]


def _run_injector() -> int:
    return injector.main([])


def _run_zensical(command: str) -> int:
    repo_root = _repo_root()
    cmd = ["zensical", command, *sys.argv[1:]]
    return subprocess.call(cmd, cwd=repo_root)


def inject_only() -> None:
    raise SystemExit(injector.main(sys.argv[1:]))


def build_site() -> None:
    code = _run_injector()
    if code != 0:
        raise SystemExit(code)
    raise SystemExit(_run_zensical("build"))


def serve_site() -> None:
    code = _run_injector()
    if code != 0:
        raise SystemExit(code)
    raise SystemExit(_run_zensical("serve"))

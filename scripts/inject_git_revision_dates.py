#!/usr/bin/env python3
"""Compatibility wrapper around md_git_date.injector."""

from __future__ import annotations

import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

from md_git_date import injector

if __name__ == "__main__":
    raise SystemExit(injector.main(sys.argv[1:]))

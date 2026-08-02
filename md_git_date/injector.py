"""injector.py.

Inject per-page git revision dates into Markdown front matter.
"""

from __future__ import annotations

import argparse
import subprocess
import sys
from collections.abc import Iterable, Sequence
from dataclasses import dataclass
from datetime import UTC, datetime
from pathlib import Path
from subprocess import CalledProcessError, TimeoutExpired


@dataclass
class FrontMatter:
    """Represents the front matter of a Markdown file."""

    has_front_matter: bool
    meta_lines: list[str]
    body: str


def git_timestamp(repo_root: Path, file_path: Path, creation: bool) -> int | None:
    """Get the git timestamp for a file.

    Args:
        repo_root: The root of the git repository.
        file_path: The path to the file.
        creation: If True, get the creation timestamp; otherwise, get the last modification timestamp.

    Returns:
        The git timestamp as an integer, or None if it cannot be determined.
    """
    rel_path = file_path.relative_to(repo_root)
    cmd = ["git", "log", "-1", "--format=%ct"]
    if creation:
        cmd.insert(2, "--diff-filter=A")
        cmd.insert(3, "--follow")
    cmd.extend(["--", str(rel_path)])

    try:
        out = subprocess.check_output(
            cmd,
            cwd=repo_root,
            stderr=subprocess.DEVNULL,
            text=True,
        ).strip()
    except (CalledProcessError, TimeoutExpired, FileNotFoundError, ValueError):
        return None

    if not out:
        return None

    try:
        return int(out)
    except ValueError:
        return None


def fmt_date(ts: int) -> str:
    """Format a timestamp as a localized date string.

    Args:
        ts: The timestamp to format.

    Returns:
        The formatted date string.
    """
    return datetime.fromtimestamp(ts, tz=UTC).astimezone().strftime(
        "%B %-d, %Y"
    )


def split_front_matter(text: str) -> FrontMatter:
    """Split the front matter from the body of a Markdown file.

    Args:
        text: The full text of the Markdown file.

    Returns:
        A FrontMatter object containing the front matter and body.
    """
    lines = text.splitlines(keepends=True)
    if not lines:
        return FrontMatter(False, [], "")

    if lines[0].strip() != "---":
        return FrontMatter(False, [], text)

    for idx in range(1, len(lines)):
        if lines[idx].strip() == "---":
            return FrontMatter(True, lines[1:idx], "".join(lines[idx + 1 :]))

    return FrontMatter(False, [], text)


def upsert_key(meta_lines: list[str], key: str, value: str) -> list[str]:
    """Upsert a key-value pair in the front matter metadata lines.

    Args:
        meta_lines: The list of metadata lines.
        key: The key to upsert.
        value: The value to associate with the key.

    Returns:
        The updated list of metadata lines.
    """
    prefix = f"{key}:"
    new_line = f'{key}: "{value}"\n'

    for i, line in enumerate(meta_lines):
        if line.lstrip().startswith(prefix):
            meta_lines[i] = new_line
            return meta_lines

    if meta_lines and not meta_lines[-1].endswith("\n"):
        meta_lines[-1] += "\n"
    meta_lines.append(new_line)
    return meta_lines


def render(front_matter: FrontMatter) -> str:
    """Render the front matter and body back into a Markdown string.

    Args:
        front_matter: The FrontMatter object to render.

    Returns:
        The rendered Markdown string.
    """
    if not front_matter.has_front_matter:
        return front_matter.body
    return "---\n" + "".join(front_matter.meta_lines) + "---\n" + front_matter.body


def update_markdown(repo_root: Path, md_file: Path) -> tuple[bool, str]:
    """Update the front matter of a Markdown file with git revision dates.

    Args:
        repo_root: The root of the git repository.
        md_file: The path to the Markdown file.

    Returns:
        A tuple containing a boolean indicating if the file was changed and the new content.
    """
    original = md_file.read_text(encoding="utf-8")
    front = split_front_matter(original)

    revision_ts = git_timestamp(repo_root, md_file, creation=False)
    creation_ts = git_timestamp(repo_root, md_file, creation=True)

    if revision_ts is None:
        return False, original

    revision_date = fmt_date(revision_ts)
    creation_date = fmt_date(creation_ts) if creation_ts is not None else revision_date

    if not front.has_front_matter:
        front = FrontMatter(True, [], original)

    front.meta_lines = upsert_key(
        front.meta_lines, "git_revision_date_localized", revision_date
    )
    front.meta_lines = upsert_key(
        front.meta_lines, "git_creation_date_localized", creation_date
    )
    front.meta_lines = upsert_key(front.meta_lines, "revision_date", revision_date)

    updated = render(front)
    return updated != original, updated


def find_markdown_files(docs_dir: Path) -> Iterable[Path]:
    """Find all Markdown files in the docs directory.

    Args:
        docs_dir: The path to the docs directory.

    Returns:
        An iterable of paths to Markdown files.
    """
    return sorted(p for p in docs_dir.rglob("*.md") if p.is_file())


def run_injection(repo_root: Path, docs_dir: Path, check: bool = False) -> int:
    """Run the injection process on all Markdown files in the docs directory.

    Args:
        repo_root: The root of the git repository.
        docs_dir: The path to the docs directory.
        check: If True, do not write files, only check for changes.

    Returns:
        An exit code: 0 if successful, 1 if changes are needed in check mode, 2 if docs directory is not found.
    """
    if not docs_dir.exists():
        print(f"Docs directory not found: {docs_dir}", file=sys.stderr)
        return 2

    changed_files: list[Path] = []
    for md_file in find_markdown_files(docs_dir):
        changed, new_content = update_markdown(repo_root, md_file)
        if not changed:
            continue

        changed_files.append(md_file)
        if not check:
            md_file.write_text(new_content, encoding="utf-8")

    if check:
        if changed_files:
            print("Front matter metadata is out of date for:")
            for path in changed_files:
                print(path.relative_to(repo_root))
            print()
            print("Check mode only: no files were modified.")
            print("Run without --check to apply updates: uv run inject-git-dates")
            return 1

        print("Front matter metadata is up to date.")
        print("Check mode only: no files were modified.")
        return 0

    print(f"Updated {len(changed_files)} Markdown files with git revision metadata.")
    return 0


def parse_args(argv: Sequence[str] | None = None) -> argparse.Namespace:
    """Parse command-line arguments for the injector script.

    Args:
        argv: A sequence of command-line arguments. If None, defaults to sys.argv[1:].

    Returns:
        An argparse.Namespace object containing the parsed arguments.
    """
    parser = argparse.ArgumentParser(
        description="Inject git revision metadata into Markdown front matter."
    )
    parser.add_argument(
        "--repo-root",
        default=str(Path(__file__).resolve().parents[1]),
        help="Repository root (defaults to package parent directory).",
    )
    parser.add_argument(
        "--docs-dir",
        default="docs",
        help="Docs directory relative to repo root.",
    )
    parser.add_argument(
        "--check",
        action="store_true",
        help="Check mode: do not write files, exit non-zero if changes are needed.",
    )
    return parser.parse_args(argv)


def main(argv: Sequence[str] | None = None) -> int:
    """Main entry point for the injector script.
    Args:
        argv: A sequence of command-line arguments. If None, defaults to sys.argv[1:].

    Returns:
        An exit code.
    """
    args = parse_args(argv)
    repo_root = Path(args.repo_root).resolve()
    docs_dir = (repo_root / args.docs_dir).resolve()
    return run_injection(repo_root=repo_root, docs_dir=docs_dir, check=args.check)

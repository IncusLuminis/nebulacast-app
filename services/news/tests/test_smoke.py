"""
Smoke test: run news pipeline and assert public/rss.xml exists and contains <rss and <item>.
Unit test: render_rss generates valid RSS from records (no network).
"""
import subprocess
import sys
import tempfile
from pathlib import Path


def test_render_rss_generates_valid_rss():
    """Unit test: generate_rss produces XML with <rss and <item> (no network)."""
    service_root = Path(__file__).resolve().parent.parent
    if str(service_root) not in sys.path:
        sys.path.insert(0, str(service_root))
    from pipelines.render_rss import generate_rss

    records = [
        {
            "title": "Test item",
            "url": "https://example.com/1",
            "stream": "news",
            "published_at": "2026-02-01T12:00:00Z",
            "summary": "Summary",
        },
    ]
    with tempfile.TemporaryDirectory() as tmp:
        out = Path(tmp) / "rss.xml"
        generate_rss(records, out, base_url="https://news.nebulacast.app/")
        content = out.read_text(encoding="utf-8")
    assert "<rss" in content
    assert "<item>" in content
    assert "Test item" in content
    assert "example.com/1" in content


def test_smoke_run_news_produces_rss():
    # Service root = parent of tests/
    service_root = Path(__file__).resolve().parent.parent
    repo_root = service_root.parent.parent
    run_news = service_root / "pipelines" / "run_news.py"
    public_rss = service_root / "public" / "rss.xml"

    assert run_news.exists(), f"run_news.py not found: {run_news}"
    env = {"PYTHONPATH": str(service_root)}
    result = subprocess.run(
        [sys.executable, str(run_news)],
        cwd=str(repo_root),
        env={**__import__("os").environ, **env},
        capture_output=True,
        text=True,
        timeout=300,
    )
    assert result.returncode == 0, (
        f"run_news.py failed (exit {result.returncode})\nstdout:\n{result.stdout}\nstderr:\n{result.stderr}"
    )
    assert public_rss.exists(), f"Expected {public_rss} to exist after run_news.py"
    content = public_rss.read_text(encoding="utf-8")
    assert "<rss" in content, "rss.xml must contain <rss"
    assert "<item>" in content, "rss.xml must contain <item>"

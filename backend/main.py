import sys
from pathlib import Path

# Add src/ to sys.path so the munim package is importable by Vercel's ASGI runner
src_path = str(Path(__file__).resolve().parent / "src")
if src_path not in sys.path:
    sys.path.insert(0, src_path)

from munim.api import app

__all__ = ["app"]

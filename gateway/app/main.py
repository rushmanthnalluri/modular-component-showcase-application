"""Compatibility entrypoint for faculty-style gateway imports."""

try:
    from gateway.main import app
except ImportError:  # pragma: no cover - fallback for direct execution
    from main import app

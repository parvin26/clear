"""Logging configuration with optional request_id for structured logs."""
import logging
import sys


def _get_request_id() -> str | None:
    try:
        from app.middleware.request_id import request_id_ctx
        return request_id_ctx.get()
    except Exception:
        return None


class RequestIdFilter(logging.Filter):
    """Add request_id to log record when available (from contextvar)."""
    def filter(self, record: logging.LogRecord) -> bool:
        rid = _get_request_id()
        record.request_id = rid if rid else "-"
        return True


def setup_logging():
    """Configure application logging with request_id in format when present."""
    fmt = "%(asctime)s - %(name)s - %(levelname)s - %(message)s"
    fmt_with_request_id = "%(asctime)s - [%(request_id)s] - %(name)s - %(levelname)s - %(message)s"
    handler = logging.StreamHandler(sys.stdout)
    handler.setFormatter(logging.Formatter(fmt_with_request_id))
    handler.addFilter(RequestIdFilter())
    logging.basicConfig(level=logging.INFO, handlers=[handler])
    # Ensure all log records have request_id for the formatter
    for name in list(logging.root.manager.loggerDict):
        logger = logging.getLogger(name)
        if not logger.filters:
            logger.addFilter(RequestIdFilter())


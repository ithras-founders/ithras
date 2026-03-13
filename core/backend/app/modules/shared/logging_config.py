"""Structured logging configuration for observability."""
import json
import logging
from datetime import datetime

from app.config import settings


class JsonFormatter(logging.Formatter):
    """JSON log formatter for production log aggregation (e.g. Cloud Logging)."""

    def format(self, record: logging.LogRecord) -> str:
        log_obj = {
            "timestamp": datetime.utcnow().isoformat() + "Z",
            "level": record.levelname,
            "logger": record.name,
            "message": record.getMessage(),
        }
        if record.exc_info:
            log_obj["exception"] = self.formatException(record.exc_info)
        # Include extra fields
        for key, value in record.__dict__.items():
            if key not in ("name", "msg", "args", "created", "filename", "funcName",
                           "levelname", "levelno", "lineno", "module", "msecs",
                           "pathname", "process", "processName", "relativeCreated",
                           "stack_info", "exc_info", "exc_text", "thread", "threadName",
                           "message", "taskName"):
                if value is not None:
                    log_obj[key] = value
        return json.dumps(log_obj)


def configure_logging() -> None:
    """Configure logging based on LOG_FORMAT env (json for production)."""
    log_format = settings.LOG_FORMAT
    ithras_logger = logging.getLogger("ithras")
    ithras_logger.setLevel(logging.INFO)
    if not ithras_logger.handlers:
        handler = logging.StreamHandler()
        if log_format == "json":
            handler.setFormatter(JsonFormatter())
        else:
            handler.setFormatter(
                logging.Formatter("%(asctime)s | %(levelname)s | %(name)s | %(message)s")
            )
        ithras_logger.addHandler(handler)

"""Coloured console logger shared across the backend."""

import logging
import os
import sys

from colorama import Fore, Style, init

init(autoreset=True)


class ColorFormatter(logging.Formatter):
    """Colour the timestamp, level and source location of each record."""

    LEVEL_COLORS = {
        logging.DEBUG: Fore.LIGHTMAGENTA_EX + Style.BRIGHT,
        logging.INFO: Fore.CYAN,
        logging.WARNING: Fore.YELLOW + Style.BRIGHT,
        logging.ERROR: Fore.RED + Style.BRIGHT,
        logging.CRITICAL: Fore.RED + Style.BRIGHT,
    }

    def __init__(self):
        super().__init__(datefmt="%Y-%m-%d %H:%M:%S")

    def format(self, record):
        """Render a record as one coloured line."""
        level_color = self.LEVEL_COLORS.get(record.levelno, Fore.WHITE)
        time = f"{Fore.GREEN}{self.formatTime(record)}{Style.RESET_ALL}"
        level = f"{level_color}{record.levelname}{Style.RESET_ALL}"
        where = f"{Fore.BLUE}{record.filename}:{record.lineno}{Style.RESET_ALL}"
        return f"{time} - {level} - {where} - {record.getMessage()}"


def _build_logger() -> logging.Logger:
    logger = logging.getLogger("hoagiemeal")
    debug = os.environ.get("DEBUG", "False").lower() in ("true", "1", "t")
    logger.setLevel(logging.INFO if debug else logging.WARNING)

    handler = logging.StreamHandler(sys.stdout)
    handler.setFormatter(ColorFormatter())
    logger.addHandler(handler)
    logger.propagate = False  # Django's root logger would otherwise print every record twice.
    return logger


logger = _build_logger()

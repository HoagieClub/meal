"""Deprecated decorator for functions in the Hoagie Meal backend.

Copyright © 2021-2024 Hoagie Club and affiliates.

Licensed under the MIT License. You may obtain a copy of the License at:

    https://github.com/hoagieclub/meal/blob/main/LICENSE

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, subject to the following conditions:

This software is provided "as-is", without warranty of any kind.
"""

import functools
from hoagiemeal.utils.logger import logger

def deprecated(reason: str = ""):
    """Mark a function as deprecated.

    Args:
        reason (str): Optional reason for the deprecation. Defaults to an empty string.

    Returns:
        Callable: The original function wrapped to log a deprecation warning.

    """
    def decorator(func):
        @functools.wraps(func)
        def wrapped_func(*args, **kwargs):
            logger.warning(f"Deprecated function {func.__name__} called. Reason: {reason}")
            return func(*args, **kwargs)

        return wrapped_func

    return decorator

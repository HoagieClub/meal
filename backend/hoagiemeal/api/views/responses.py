"""The JSON envelope every endpoint returns: {"data": ..., "message": ..., "error": ...}."""

from rest_framework.response import Response


def ok(data, message: str = "OK") -> Response:
    """A successful response."""
    return Response({"data": data, "message": message, "error": None})


def error(message: str, http_status: int) -> Response:
    """A failed response. `error` and `message` carry the same text so either can be shown."""
    return Response({"data": None, "message": message, "error": message}, status=http_status)

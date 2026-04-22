"""API view for receiving free food listserv emails from Power Automate.

Copyright © 2021-2025 Hoagie Club and affiliates.

Licensed under the MIT License. You may obtain a copy of the License at:

  https://github.com/hoagieclub/meal/blob/main/LICENSE

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

This software is provided "as-is", without warranty of any kind.
"""

import os
from datetime import datetime
from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework import status
from hoagiemeal.models.free_food import FreeFoodAlert
from hoagiemeal.utils.logger import logger

WEBHOOK_SECRET = os.environ.get("FREEFOOD_WEBHOOK_SECRET", "")


@api_view(["POST"])
def receive_freefood_email(request):
    """Receive a free food listserv email POSTed by Power Automate."""
    token = request.headers.get("X-Webhook-Secret", "")
    if not WEBHOOK_SECRET or token != WEBHOOK_SECRET:
        return Response({"error": "Unauthorized"}, status=status.HTTP_401_UNAUTHORIZED)

    email_id = request.data.get("email_id", "").strip()
    subject = request.data.get("subject", "").strip()
    body = request.data.get("body", "").strip()

    if not subject and not body:
        return Response(
            {"error": "subject or body is required"},
            status=status.HTTP_400_BAD_REQUEST,
        )

    def parse_dt(value):
        if not value:
            return None
        for fmt in ("%Y-%m-%dT%H:%M:%SZ", "%Y-%m-%dT%H:%M:%S.%fZ", "%Y-%m-%dT%H:%M:%S%z"):
            try:
                return datetime.strptime(value, fmt)
            except ValueError:
                continue
        logger.warning(f"Could not parse datetime: {value!r}")
        return None

    alert, created = FreeFoodAlert.objects.using("freefood").update_or_create(
        email_id=email_id or subject,
        defaults={
            "subject": subject,
            "body": body,
            "food": request.data.get("food", "").strip() or None,
            "location": request.data.get("location", "").strip() or None,
            "event": request.data.get("event", "").strip() or None,
            "start_time": parse_dt(request.data.get("start_time")),
            "end_time": parse_dt(request.data.get("end_time")),
        },
    )

    logger.info(f"FreeFoodAlert {'created' if created else 'updated'}: id={alert.id}, subject={subject!r}")
    return Response(
        {"data": {"id": alert.id, "created": created}, "message": "Free food alert recorded."},
        status=status.HTTP_201_CREATED if created else status.HTTP_200_OK,
    )

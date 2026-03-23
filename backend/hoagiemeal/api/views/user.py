"""API views for user management.

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

from hoagiemeal.utils.logger import logger
from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework import status
from hoagiemeal.api.services.user import get_user_from_request
from hoagiemeal.serializers import UserSerializer


@api_view(["POST"])
def verify_and_get_or_create_user(request):
    """Verify if the user is authenticated and create the user if they don't exist."""
    logger.debug("Verifying user by Auth0 token.")
    user = get_user_from_request(request)
    if not user:
        return Response(
            {
                "data": None,
                "message": "Failed to get or create user",
                "error": "Failed to get or create user",
            },
            status=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )
    return Response(
        {
            "data": UserSerializer(user).data,
            "message": "User fetched or created successfully.",
            "error": None,
        },
        status=status.HTTP_200_OK,
    )

"""API endpoints for user management.

This module provides the API endpoints for user management, including authentication and user data retrieval.

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

import jwt
from typing import Optional, Any
from jwt import PyJWKClient
from django.conf import settings
from hoagiemeal.utils.logger import logger
from rest_framework.decorators import api_view
from rest_framework.response import Response
from django.http import HttpRequest
from django.contrib.auth import get_user_model
from datetime import datetime
from typing import TypedDict, List
from django.utils import timezone
from hoagiemeal.serializers import UserSerializer
from django.db import transaction
from django.contrib.auth import get_user_model

User = get_user_model()

_JWK_CLIENT = PyJWKClient(f"{settings.AUTH0_ISSUER}.well-known/jwks.json")
HOAGIE_IO_EMAIL_CLAIM = "https://hoagie.io/email"
HOAGIE_IO_NAME_CLAIM = "https://hoagie.io/name"


def decode_auth0_token(request: HttpRequest) -> Optional[dict]:
    """Decode the Auth0 token from the request."""
    logger.info(f"Decoding Auth0 token from request: {request}")
    try:
        auth_headers = request.headers.get("Authorization")
        auth0_token = auth_headers.split()[1].strip()
        key = _JWK_CLIENT.get_signing_key_from_jwt(auth0_token).key
        auth0_claims = jwt.decode(
            auth0_token,
            key,
            algorithms=["RS256"],
            audience=settings.AUTH0_AUDIENCE,
            issuer=settings.AUTH0_ISSUER,
            options={"require": ["exp", "iat", "iss", "aud", "sub"]},
            leeway=5,
        )
        logger.info(f"Auth0 token decoded successfully for request: {request}.")
        return auth0_claims
    except Exception as e:
        logger.error(f"Failed to decode Auth0 token from request: {request}: {e}")
        return None


def get_or_create_user(auth0_claims: dict) -> Optional[Any]:
    """Get or create a user based on Auth0 token claims."""
    logger.info(f"Getting or creating user based on Auth0 token claims: {auth0_claims}.")
    auth0_id = auth0_claims.get("sub")
    if not auth0_id:
        logger.error(f"Auth0 ID is required in Auth0 token claims: {auth0_claims}.")
        return None

    try:
        user = User.objects.get(auth0_id=auth0_id)
        user.last_login = timezone.now()
        user.save()
        logger.info(f"User found for auth0_id: {auth0_id}")
        return user
    except User.DoesNotExist:
        email = auth0_claims.get(HOAGIE_IO_EMAIL_CLAIM)
        full_name = auth0_claims.get(HOAGIE_IO_NAME_CLAIM)
        name_parts = full_name.split(" ") if full_name else []
        first_name = name_parts[0] if len(name_parts) > 0 else ""
        last_name = name_parts[-1] if len(name_parts) > 1 else ""
        username = email.split("@")[0] if email else ""
        last_login = timezone.now()

        user, created = User.objects.get_or_create(
            auth0_id=auth0_id,
            email=email,
            first_name=first_name,
            last_name=last_name,
            username=username,
            last_login=last_login,
        )

        logger.info(f"User created for auth0_id: {auth0_id}")
        return user
    except Exception as e:
        logger.error(f"Failed to get or create user for auth0_id: {auth0_id}: {e}")
        return None


def get_user_from_request(request: HttpRequest) -> Optional[Any]:
    """Get user from request using Auth0 token."""
    try:
        auth0_claims = decode_auth0_token(request)
        if not auth0_claims:
            logger.error(f"Failed to decode Auth0 token from request: {request}.")
            return None

        user = get_or_create_user(auth0_claims)
        if not user:
            logger.error(f"Failed to get or create user from request: {request}.")
            return None

        logger.info(f"User fetched from request: {request}.")
        return user
    except Exception as e:
        logger.error(f"Error getting user from request: {request}: {e}")
        return None


@api_view(["POST"])
def verify_and_get_or_create_user(request):
    """Verify if the user is authenticated and create the user if they don't exist."""
    logger.info(f"Verifying and getting or creating user by Auth0 token from request: {request}")
    user = get_user_from_request(request)
    if not user:
        return Response(
            {"data": None, "message": "Failed to get or create user", "error": "Failed to get or create user"},
            status=500,
        )
    return Response(
        {"data": UserSerializer(user).data, "message": "User fetched or created successfully.", "error": None},
        status=200,
    )

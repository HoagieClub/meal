"""API endpoints for user management.

This module provides the API endpoints for user management, including authentication, profile updates, and data retrieval.

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
from hoagiemeal.models.user import UserProfile
from django.utils import timezone
from hoagiemeal.serializers import UserSerializer, UserProfileSerializer

User = get_user_model()
_JWK_CLIENT = PyJWKClient(f"{settings.AUTH0_ISSUER}.well-known/jwks.json")

HOAGIE_IO_EMAIL_CLAIM = "https://hoagie.io/email"
HOAGIE_IO_NAME_CLAIM = "https://hoagie.io/name"

Auth0Claims = TypedDict(
    "Auth0Claims",
    {
        "iss": str,
        "sub": str,
        "aud": List[str],
        "iat": int,
        "exp": int,
        "scope": str,
        "azp": str,
        "https://hoagie.io/email": str,
        "https://hoagie.io/name": str,
    },
    total=False,
)

DEFAULT_USER_PROFILE_DATA = {
    "dietary_restrictions": [],
    "allergens": [],
    "dining_halls": [],
    "daily_calorie_target": 0,
    "daily_protein_target": 0,
    "show_nutrition": True,
}


class AuthTokenError(Exception):
    """Exception raised for errors in the authentication token."""

    pass


class UserAPI:
    """API endpoints for user management, including authentication, profile updates, and data retrieval."""

    JWK_CLIENT = _JWK_CLIENT
    HOAGIE_IO_EMAIL_CLAIM = HOAGIE_IO_EMAIL_CLAIM
    HOAGIE_IO_NAME_CLAIM = HOAGIE_IO_NAME_CLAIM
    DEFAULT_USER_PROFILE_DATA = DEFAULT_USER_PROFILE_DATA

    def get_or_create_user(self, auth0_claims: Auth0Claims) -> Optional[Any]:
        """Get or create a user based on Auth0 token claims.

        Args:
            auth0_claims (Auth0Claims): The Auth0 token claims.

        Returns:
            Optional[Any]: The user if they exist, otherwise None.

        """
        logger.info(f"Getting or creating user based on Auth0 token claims: {auth0_claims}")
        auth0_id = auth0_claims.get("sub")
        try:
            logger.info(f"User exists, getting user based on Auth0 ID: {auth0_id}")
            user = User.objects.get(auth0_id=auth0_id)
            user.last_login = timezone.now()
            user.save()
            return user

        except User.DoesNotExist:
            logger.info(f"User does not exist, creating user based on Auth0 token claims: {auth0_claims}")
            email = auth0_claims.get(self.HOAGIE_IO_EMAIL_CLAIM)
            full_name = auth0_claims.get(self.HOAGIE_IO_NAME_CLAIM)
            name_parts = full_name.split(" ") if full_name else []
            first_name = name_parts[0] if len(name_parts) > 0 else ""
            last_name = name_parts[-1] if len(name_parts) > 1 else ""
            username = email.split("@")[0] if email else ""
            last_login = timezone.now()

            user = User.objects.create(
                auth0_id=auth0_id,
                email=email,
                first_name=first_name,
                last_name=last_name,
                username=username,
                last_login=last_login,
            )
            return user

    def get_or_create_user_profile(self, user_id: int) -> Optional[UserProfile]:
        """Get or create a user profile for the given user.

        Args:
            user_id (int): The ID of the user.

        Returns:
            Optional[UserProfile]: The user profile if it exists, otherwise None.

        """
        logger.info(f"Getting or creating user profile for user ID: {user_id}")
        try:
            user_profile = UserProfile.objects.get(user_id=user_id)
            logger.info(f"User profile exists, getting user profile for user ID: {user_id}")
            return user_profile

        except UserProfile.DoesNotExist:
            logger.info(f"User profile does not exist, creating user profile for user ID: {user_id}")
            new_user_profile_data = self.DEFAULT_USER_PROFILE_DATA.copy()
            user_profile = UserProfile.objects.create(user_id=user_id, **new_user_profile_data)
            return user_profile

    def update_user_profile(self, user_id: int, user_profile_data: dict) -> Optional[UserProfile]:
        """Update the user profile for the given user.

        Args:
            user_id (int): The ID of the user.
            user_profile_data (dict): The data to update the user profile with.

        Returns:
            Optional[UserProfile]: The updated user profile.

        """
        logger.info(f"Updating user profile for user ID: {user_id} with data: {user_profile_data}")
        user_profile = UserProfile.objects.get(user_id=user_id)
        serializer = UserProfileSerializer(user_profile, data=user_profile_data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return user_profile

    def decode_auth0_token(self, request: HttpRequest) -> Auth0Claims:
        """Decode the Auth0 token from the request.

        Args:
            request (HttpRequest): The request object.

        Returns:
            Auth0Claims: The Auth0 token claims.

        """
        logger.info(f"Decoding Auth0 token from request: {request}")
        try:
            auth_headers = request.headers.get("Authorization")
            auth0_token = auth_headers.split()[1].strip()
            key = self.JWK_CLIENT.get_signing_key_from_jwt(auth0_token).key
            auth0_claims: Auth0Claims = jwt.decode(
                auth0_token,
                key,
                algorithms=["RS256"],
                audience=settings.AUTH0_AUDIENCE,
                issuer=settings.AUTH0_ISSUER,
                options={"require": ["exp", "iat", "iss", "aud", "sub"]},
                leeway=5,
            )
            return auth0_claims
        except Exception as e:
            raise AuthTokenError(e) from e


#################### Exposed endpoints #########################

user_api = UserAPI()


@api_view(["GET"])
def get_user(request):
    """Get the user by the given Auth0 token.

    Args:
        request (HttpRequest): The request object.

    Returns:
        Response: The response object.
        user (User): The user's data.

    """
    logger.info(f"Getting user by Auth0 token from request: {request}")
    try:
        auth0_claims = user_api.decode_auth0_token(request)
        auth0_id = auth0_claims.get("sub")
        user = User.objects.get(auth0_id=auth0_id)
        user_data = UserSerializer(user).data
        return Response({"user": user_data}, status=200)
    except AuthTokenError:
        return Response({"error": "Authentication error"}, status=401)
    except User.DoesNotExist:
        return Response({"error": "User not found"}, status=404)
    except Exception as e:
        logger.error(f"Error in get_user view: {e}")
        return Response({"error": str(e)}, status=500)


@api_view(["GET"])
def get_user_profile(request):
    """Get the user profile by the given Auth0 token.

    Args:
        request (HttpRequest): The request object.

    Returns:
        Response: The response object.
        user_profile (UserProfile): The user profile.

    """
    logger.info(f"Getting user profile by Auth0 token from request: {request}")
    try:
        auth0_claims = user_api.decode_auth0_token(request)
        auth0_id = auth0_claims.get("sub")
        user = User.objects.get(auth0_id=auth0_id)
        user_profile = UserProfile.objects.get(user_id=user.id)
        user_profile_data = UserProfileSerializer(user_profile).data
        return Response({"user_profile": user_profile_data}, status=200)
    except AuthTokenError:
        return Response({"error": "Authentication error"}, status=401)
    except UserProfile.DoesNotExist:
        return Response({"error": "User profile not found"}, status=404)
    except Exception as e:
        logger.error(f"Error in get_user_profile view: {e}")
        return Response({"error": str(e)}, status=500)


@api_view(["POST"])
def verify_and_get_or_create_user_and_profile(request):
    """Verify if the user is authenticated and create the user and user profile if they don't exist.

    Args:
        request (HttpRequest): The request object.

    Returns:
        Response: The response object.
        user (User): The user's data.
        user_profile (UserProfile): The user profile.

    """
    logger.info(f"Verifying and getting or creating user and profile by Auth0 token from request: {request}")
    try:
        auth0_claims = user_api.decode_auth0_token(request)
        user = user_api.get_or_create_user(auth0_claims)
        user_profile = user_api.get_or_create_user_profile(user.id)  # type: ignore
        user_data = UserSerializer(user).data
        user_profile_data = UserProfileSerializer(user_profile).data
        return Response({"user": user_data, "user_profile": user_profile_data}, status=200)
    except AuthTokenError:
        return Response({"error": "Authentication error"}, status=401)
    except Exception as e:
        logger.error(f"Error in verify_and_get_or_create_user_and_profile view: {e}")
        return Response({"error": str(e)}, status=500)


@api_view(["POST"])
def update_user_profile(request):
    """Update user's profile information.

    Args:
        request (HttpRequest): The request object.

    Returns:
        Response: The response object.
        user_profile (UserProfile): The user profile.

    """
    try:
        auth0_claims = user_api.decode_auth0_token(request)
        auth0_id = auth0_claims.get("sub")
        user = User.objects.get(auth0_id=auth0_id)
        user_profile = user_api.update_user_profile(user.id, request.data)
        user_profile_data = UserProfileSerializer(user_profile).data
        return Response({"user_profile": user_profile_data}, status=200)
    except AuthTokenError:
        return Response({"error": "Authentication error"}, status=401)
    except User.DoesNotExist:
        return Response({"error": "User not found"}, status=404)
    except UserProfile.DoesNotExist:
        return Response({"error": "User profile not found"}, status=404)
    except Exception as e:
        logger.error(f"Error in update_user_profile view: {e}")
        return Response({"error": str(e)}, status=500)

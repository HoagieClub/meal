"""Django serializers for the Hoagie Meal application.

Copyright © 2021-2025 Hoagie Club and affiliates.

Licensed under the MIT License. You may obtain a copy of the License at:

    https://github.com/hoagieclub/meal/blob/main/LICENSE

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, subject to the following conditions:

This software is provided "as-is", without warranty of any kind.
"""

from rest_framework import serializers
from django.db import models
from hoagiemeal.models.user import CustomUser
from hoagiemeal.models.menu import MenuItem, MenuItemInteraction, MenuItemMetrics
from hoagiemeal.models.dining import DiningVenue
from django.contrib.auth import get_user_model

User = get_user_model()


class GeoLocationSerializer(serializers.Serializer):
    """Serializer for the GeoLocation model."""

    lat = serializers.CharField()
    long = serializers.CharField()


class DiningEventSerializer(serializers.Serializer):
    """Serializer for the DiningEvent model."""

    summary = serializers.CharField()
    start = serializers.CharField()
    end = serializers.CharField()
    uid = serializers.CharField()
    description = serializers.CharField()


class UserSerializer(serializers.ModelSerializer):
    """Serializer for the CustomUser model."""

    class Meta:
        """Meta class for the UserSerializer."""

        model = User
        fields = [
            "id",
            "username",
            "email",
            "first_name",
            "last_name",
            "net_id",
            "class_year",
            "auth0_id",
        ]
        read_only_fields = ["id", "created_at", "updated_at"]


class MenuItemInteractionSerializer(serializers.ModelSerializer):
    """Serializer for the MenuItemInteraction model."""

    class Meta:
        """Meta class for the MenuItemInteractionSerializer."""

        model = MenuItemInteraction
        fields = "__all__"
        read_only_fields = ["id", "user", "menu_item", "created_at", "updated_at"]


class MenuItemMetricsSerializer(serializers.ModelSerializer):
    """Serializer for the MenuItemMetrics model."""

    class Meta:
        """Meta class for the MenuItemMetricsSerializer."""

        model = MenuItemMetrics
        fields = "__all__"
        read_only_fields = ["id", "menu_item", "created_at", "updated_at"]


class MenuItemSerializer(serializers.ModelSerializer):
    """Serializer for the MenuItem model."""

    class Meta:
        """Meta class for the MenuItemSerializer."""

        model = MenuItem
        exclude = ["created_at", "updated_at"]
        read_only_fields = ["api_id"]


class FullMenuItemSerializer(serializers.ModelSerializer):
    """Serializer for a MenuItem with all details including interactions and metrics."""

    interactions = MenuItemInteractionSerializer(many=True, read_only=True)
    metrics = MenuItemMetricsSerializer(read_only=True)

    class Meta:
        """Meta class for the FullMenuItemSerializer."""

        model = MenuItem
        exclude = ["created_at", "updated_at"]
        read_only_fields = ["api_id"]


class DiningVenueSerializer(serializers.ModelSerializer):
    """Serializer for the DiningVenue model."""

    class Meta:
        """Meta class for the DiningVenueSerializer."""

        model = DiningVenue
        exclude = ["created_at", "updated_at"]
        read_only_fields = ["id", "created_at", "updated_at"]

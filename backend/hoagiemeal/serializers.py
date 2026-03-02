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
from hoagiemeal.models.menu import ResidentialMenu, RetailMenu
from hoagiemeal.models.menu_item import MenuItem, MenuItemNutrition
from hoagiemeal.models.engagement import MenuItemInteraction, MenuItemMetrics
from hoagiemeal.models.dining import DiningLocation
from django.contrib.auth import get_user_model

User = get_user_model()


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
        read_only_fields = ["id"]


class ResidentialMenuSerializer(serializers.ModelSerializer):
    """Serializer for the ResidentialMenu model."""

    class Meta:
        """Meta class for the ResidentialMenuSerializer."""

        model = ResidentialMenu
        exclude = ["created_at", "updated_at"]


class RetailMenuSerializer(serializers.ModelSerializer):
    """Serializer for the RetailMenu model."""

    class Meta:
        """Meta class for the RetailMenuSerializer."""

        model = RetailMenu
        exclude = ["created_at", "updated_at"]


class MenuItemInteractionSerializer(serializers.ModelSerializer):
    """Serializer for the MenuItemInteraction model."""

    class Meta:
        """Meta class for the MenuItemInteractionSerializer."""

        model = MenuItemInteraction
        exclude = ["created_at", "updated_at"]


class MenuItemMetricsSerializer(serializers.ModelSerializer):
    """Serializer for the MenuItemMetrics model."""

    class Meta:
        """Meta class for the MenuItemMetricsSerializer."""

        model = MenuItemMetrics
        exclude = ["created_at", "updated_at"]


class MenuItemNutritionSerializer(serializers.ModelSerializer):
    """Serializer for the MenuItemNutrition model."""

    class Meta:
        """Meta class for the MenuItemNutritionSerializer."""

        model = MenuItemNutrition
        exclude = ["created_at", "updated_at", "menu_item"]


class MenuItemSerializer(serializers.ModelSerializer):
    """Serializer for the MenuItem model."""

    nutrition = MenuItemNutritionSerializer(read_only=True, allow_null=True, required=False)

    class Meta:
        """Meta class for the MenuItemSerializer."""

        model = MenuItem
        exclude = ["created_at", "updated_at"]


class DiningLocationSerializer(serializers.ModelSerializer):
    """Serializer for the DiningLocation model."""

    class Meta:
        """Meta class for the DiningLocationSerializer."""

        model = DiningLocation
        exclude = ["created_at", "updated_at"]

"""DRF serializers for API responses."""

from rest_framework import serializers

from hoagiemeal.models.dining import DiningLocation
from hoagiemeal.models.engagement import MenuItemInteraction, MenuItemMetrics
from hoagiemeal.models.menu_item import MenuItem, MenuItemNutrition
from hoagiemeal.models.user import CustomUser


class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = CustomUser
        fields = ["id", "username", "email", "first_name", "last_name", "net_id", "class_year", "auth0_id"]
        read_only_fields = ["id"]


class MenuItemInteractionSerializer(serializers.ModelSerializer):
    class Meta:
        model = MenuItemInteraction
        exclude = ["created_at", "updated_at"]


class MenuItemMetricsSerializer(serializers.ModelSerializer):
    class Meta:
        model = MenuItemMetrics
        exclude = ["created_at", "updated_at"]


class MenuItemNutritionSerializer(serializers.ModelSerializer):
    class Meta:
        model = MenuItemNutrition
        exclude = ["created_at", "updated_at", "menu_item"]


class MenuItemSerializer(serializers.ModelSerializer):
    nutrition = MenuItemNutritionSerializer(read_only=True, allow_null=True, required=False)

    class Meta:
        model = MenuItem
        exclude = ["created_at", "updated_at"]


class DiningLocationSerializer(serializers.ModelSerializer):
    class Meta:
        model = DiningLocation
        exclude = ["created_at", "updated_at"]

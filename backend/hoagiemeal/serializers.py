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
from hoagiemeal.models.user import CustomUser, UserProfile
from hoagiemeal.models.menu import MenuItem, MenuItemNutrient
from hoagiemeal.models.dining import DiningVenue


class GeoLocationSerializer(serializers.Serializer):
    """Serializer for the GeoLocation model."""

    lat = serializers.CharField()
    long = serializers.CharField()


class BuildingSerializer(serializers.Serializer):
    """Serializer for the Building model."""

    name = serializers.CharField()
    location_id = serializers.CharField()


class AmenitySerializer(serializers.Serializer):
    """Serializer for the Amenity model."""

    name = serializers.CharField()


class DiningLocationSerializer(serializers.Serializer):
    """Serializer for the DiningLocation model."""

    name = serializers.CharField()
    mapName = serializers.CharField()
    dbid = serializers.CharField()
    geoloc = GeoLocationSerializer()
    building = BuildingSerializer()
    amenities = serializers.SerializerMethodField()

    def get_amenities(self, obj):
        """Get the amenities for the dining location."""
        amenities_data = obj["amenities"]["amenity"]
        if isinstance(amenities_data, list):
            return [amenity["name"] for amenity in amenities_data]
        return [amenities_data["name"]]


class DiningEventSerializer(serializers.Serializer):
    """Serializer for the DiningEvent model."""

    summary = serializers.CharField()
    start = serializers.CharField()
    end = serializers.CharField()
    uid = serializers.CharField()
    description = serializers.CharField()


# class MenuRatingSerializer(serializers.ModelSerializer):
#     """Serializer for the MenuRating model."""

#     username = serializers.SerializerMethodField()
#     menu_item_name = serializers.SerializerMethodField()

#     class Meta:
#         """Meta class for the MenuRatingSerializer."""

#         model = MenuRating
#         fields = [
#             "id",
#             "user",
#             "username",
#             "menu_item",
#             "menu_item_name",
#             "rating",
#             "comment",
#             "created_at",
#             "updated_at",
#             "is_anonymous",
#             "dining_experience",
#             "taste_rating",
#             "presentation_rating",
#             "value_rating",
#         ]
#         read_only_fields = ["id", "user", "username", "menu_item_name", "created_at", "updated_at"]

#     def get_username(self, obj):
#         """Get the username of the user who created the rating."""
#         if obj.is_anonymous:
#             return "Anonymous"
#         return obj.user.get_full_name()

#     def get_menu_item_name(self, obj):
#         """Get the name of the menu item being rated."""
#         return obj.menu_item.name


# class MenuRatingCreateSerializer(serializers.ModelSerializer):
#     """Serializer for creating a MenuRating."""

#     class Meta:
#         """Meta class for the MenuRatingCreateSerializer."""

#         model = MenuRating
#         fields = [
#             "menu_item",
#             "rating",
#             "comment",
#             "is_anonymous",
#             "dining_experience",
#             "taste_rating",
#             "presentation_rating",
#             "value_rating",
#         ]

#     def create(self, validated_data):
#         """Create a new MenuRating instance.

#         If a rating already exists for this user and menu item, update it instead.
#         """
#         user = self.context["request"].user
#         menu_item = validated_data.get("menu_item")

#         # Check if a rating already exists
#         try:
#             rating = MenuRating.objects.get(user=user, menu_item=menu_item)
#             # Update existing rating
#             for key, value in validated_data.items():
#                 setattr(rating, key, value)
#             rating.save()
#             return rating
#         except MenuRating.DoesNotExist:
#             # Create new rating
#             return MenuRating.objects.create(user=user, **validated_data)


# class MenuItemWithRatingsSerializer(serializers.ModelSerializer):
#     """Serializer for MenuItem with aggregated ratings."""

#     average_rating = serializers.SerializerMethodField()
#     rating_count = serializers.SerializerMethodField()
#     user_rating = serializers.SerializerMethodField()

#     class Meta:
#         """Meta class for the MenuItemWithRatingsSerializer."""

#         model = MenuItem
#         fields = ["id", "name", "description", "link", "average_rating", "rating_count", "user_rating"]

#     def get_average_rating(self, obj):
#         """Get the average rating for the menu item."""
#         return obj.ratings.aggregate(avg_rating=models.Avg("rating"))["avg_rating"]

#     def get_rating_count(self, obj):
#         """Get the number of ratings for the menu item."""
#         return obj.ratings.count()

#     def get_user_rating(self, obj):
#         """Get the current user's rating for the menu item, if it exists."""
#         user = self.context.get("request").user
#         if user.is_authenticated:
#             try:
#                 rating = obj.ratings.get(user=user)
#                 return MenuRatingSerializer(rating).data
#             except MenuRating.DoesNotExist:
#                 return None
#         return None


class UserSerializer(serializers.ModelSerializer):
    """Serializer for the CustomUser model."""

    class Meta:
        model = CustomUser
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


class UserProfileSerializer(serializers.ModelSerializer):
    """Serializer for the UserProfile model."""

    class Meta:
        model = UserProfile
        fields = [
            "id",
            "user",
            "dietary_restrictions",
            "allergens",
            "dining_halls",
            "daily_calorie_target",
            "daily_protein_target",
            "show_nutrition",
        ]
        read_only_fields = ["id", "user", "created_at", "updated_at"]


class MenuItemNutrientSerializer(serializers.ModelSerializer):
    """Serializer for the MenuItemNutrient model."""

    class Meta:
        model = MenuItemNutrient
        exclude = ["updated_at", "created_at", "id", "menu_item"]
        read_only_fields = ["id", "menu_item", "created_at", "updated_at"]


class MenuItemSerializer(serializers.ModelSerializer):
    """Serializer for the MenuItem model."""

    class Meta:
        model = MenuItem
        fields = ["api_id", "name", "description", "link"]
        read_only_fields = ["id", "created_at", "updated_at", "api_id"]


class FullMenuItemSerializer(serializers.ModelSerializer):
    """Serializer for a MenuItem with all details including nutrients, dietary info, and ratings."""

    nutrition = MenuItemNutrientSerializer(read_only=True)

    class Meta:
        model = MenuItem
        exclude = ["updated_at", "created_at", "id"]
        read_only_fields = ["id", "created_at", "updated_at", "api_id"]


class DiningVenueSerializer(serializers.ModelSerializer):
    """Serializer for the DiningVenue model."""

    class Meta:
        model = DiningVenue
        exclude = ["updated_at", "created_at"]
        read_only_fields = ["id", "database_id", "category_id", "created_at", "updated_at"]

"""Django serializer for the Hoagie Meal backend."""

from rest_framework import serializers
from django.db import models
from hoagiemeal.models.menu import MenuItem, MenuRating
from hoagiemeal.models.user import CustomUser

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


class MenuItemSerializer(serializers.Serializer):
    """Serializer for the MenuItem model."""

    id = serializers.CharField()
    name = serializers.CharField()
    description = serializers.CharField()
    link = serializers.CharField()


class DiningEventSerializer(serializers.Serializer):
    """Serializer for the DiningEvent model."""

    summary = serializers.CharField()
    start = serializers.CharField()
    end = serializers.CharField()
    uid = serializers.CharField()
    description = serializers.CharField()


class MenuRatingSerializer(serializers.ModelSerializer):
    """Serializer for the MenuRating model."""

    username = serializers.SerializerMethodField()
    menu_item_name = serializers.SerializerMethodField()

    class Meta:
        """Meta class for the MenuRatingSerializer."""

        model = MenuRating
        fields = [
            "id",
            "user",
            "username",
            "menu_item",
            "menu_item_name",
            "rating",
            "comment",
            "created_at",
            "updated_at",
            "is_anonymous",
            "dining_experience",
            "taste_rating",
            "presentation_rating",
            "value_rating",
        ]
        read_only_fields = ["id", "user", "username", "menu_item_name", "created_at", "updated_at"]

    def get_username(self, obj):
        """Get the username of the user who created the rating."""
        if obj.is_anonymous:
            return "Anonymous"
        return obj.user.get_full_name()

    def get_menu_item_name(self, obj):
        """Get the name of the menu item being rated."""
        return obj.menu_item.name


class MenuRatingCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating a MenuRating."""

    class Meta:
        """Meta class for the MenuRatingCreateSerializer."""

        model = MenuRating
        fields = [
            "menu_item",
            "rating",
            "comment",
            "is_anonymous",
            "dining_experience",
            "taste_rating",
            "presentation_rating",
            "value_rating",
        ]

    def create(self, validated_data):
        """Create a new MenuRating instance.

        If a rating already exists for this user and menu item, update it instead.
        """
        user = self.context["request"].user
        menu_item = validated_data.get("menu_item")

        # Check if a rating already exists
        try:
            rating = MenuRating.objects.get(user=user, menu_item=menu_item)
            # Update existing rating
            for key, value in validated_data.items():
                setattr(rating, key, value)
            rating.save()
            return rating
        except MenuRating.DoesNotExist:
            # Create new rating
            return MenuRating.objects.create(user=user, **validated_data)


class MenuItemWithRatingsSerializer(serializers.ModelSerializer):
    """Serializer for MenuItem with aggregated ratings."""

    average_rating = serializers.SerializerMethodField()
    rating_count = serializers.SerializerMethodField()
    user_rating = serializers.SerializerMethodField()

    class Meta:
        """Meta class for the MenuItemWithRatingsSerializer."""

        model = MenuItem
        fields = ["id", "name", "description", "link", "average_rating", "rating_count", "user_rating"]

    def get_average_rating(self, obj):
        """Get the average rating for the menu item."""
        return obj.ratings.aggregate(avg_rating=models.Avg("rating"))["avg_rating"]

    def get_rating_count(self, obj):
        """Get the number of ratings for the menu item."""
        return obj.ratings.count()

    def get_user_rating(self, obj):
        """Get the current user's rating for the menu item, if it exists."""
        user = self.context.get("request").user
        if user.is_authenticated:
            try:
                rating = obj.ratings.get(user=user)
                return MenuRatingSerializer(rating).data
            except MenuRating.DoesNotExist:
                return None
        return None
    

class UserSerializer(serializers.ModelSerializer):
    """Serializer for the CustomUser model."""
    class Meta:
        """Meta class for the UserSerializer."""

        model = CustomUser
        fields = '__all__'
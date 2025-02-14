"""Django serializer for the Hoagie Meal backend."""

from rest_framework import serializers


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

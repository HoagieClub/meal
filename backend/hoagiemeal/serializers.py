"""
Django serializer for the Hoagie Meal backend.
"""

from rest_framework import serializers


class GeoLocationSerializer(serializers.Serializer):
    lat = serializers.CharField()
    long = serializers.CharField()


class BuildingSerializer(serializers.Serializer):
    name = serializers.CharField()
    location_id = serializers.CharField()


class AmenitySerializer(serializers.Serializer):
    name = serializers.CharField()


class DiningLocationSerializer(serializers.Serializer):
    name = serializers.CharField()
    mapName = serializers.CharField()
    dbid = serializers.CharField()
    geoloc = GeoLocationSerializer()
    building = BuildingSerializer()
    amenities = serializers.SerializerMethodField()

    def get_amenities(self, obj):
        amenities_data = obj["amenities"]["amenity"]
        if isinstance(amenities_data, list):
            return [amenity["name"] for amenity in amenities_data]
        return [amenities_data["name"]]


class MenuItemSerializer(serializers.Serializer):
    id = serializers.CharField()
    name = serializers.CharField()
    description = serializers.CharField()
    link = serializers.CharField()


class DiningEventSerializer(serializers.Serializer):
    summary = serializers.CharField()
    start = serializers.CharField()
    end = serializers.CharField()
    uid = serializers.CharField()
    description = serializers.CharField()

"""Django models related to the dining venues.

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

from django.db import models
from django.utils.translation import gettext_lazy as _
from django.contrib.postgres.fields import ArrayField


class DiningVenue(models.Model):
    """Represent a dining venue on campus.

    This model maps to the dining API's location data.

    Attributes:
        name (str): Name of the dining hall.
        map_name (str): Name used for mapping purposes.
        database_id (int): Unique API location identifier.
        latitude (float): Latitude coordinate.
        longitude (float): Longitude coordinate.
        building_name (str): Name of the building.
        amenities (list of str): List of available amenities.
        is_active (bool): Operational status of the dining hall.
        category_id (int): The category ID of the dining venue.
        created_at (datetime): Timestamp when the record was created.
        updated_at (datetime): Timestamp when the record was last updated.

    """

    name = models.CharField(max_length=255, unique=True)
    map_name = models.CharField(max_length=255)
    database_id = models.PositiveIntegerField(unique=True, help_text=_("API's location identifier"), primary_key=True)
    latitude = models.DecimalField(max_digits=9, decimal_places=6)
    longitude = models.DecimalField(max_digits=9, decimal_places=6)
    building_name = models.CharField(max_length=255)
    amenities = ArrayField(models.CharField(max_length=100), blank=True, default=list)
    is_active = models.BooleanField(default=True, help_text=_("Whether this dining hall is currently operational"))
    category_id = models.PositiveIntegerField(help_text=_("The category ID of the dining venue"), null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        """Meta class for the DiningVenue model."""

        db_table = "dining_venues"
        indexes = [
            models.Index(fields=["database_id"]),
            models.Index(fields=["name"]),
            models.Index(fields=["category_id"]),
        ]
        
    

    def __str__(self):
        """Return the string representation of the DiningVenue instance.

        Returns:
            str: The dining hall name along with the building name.

        """
        return f"{self.name} ({self.building_name})"

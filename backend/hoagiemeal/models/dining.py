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


class DiningLocation(models.Model):
    """Represent a dining location on campus.

    Attributes:
        id (str): The unique API location identifier.
        category (str): The category ID of the dining venue.
        name (str): The name of the dining venue.
        url (str): The URL of the dining venue.

        created_at (DateTimeField): The date and time the dining location was created.
        updated_at (DateTimeField): The date and time the dining location was last updated.

    """

    id = models.CharField(max_length=50, primary_key=True, help_text=_("API's location identifier"))
    category = models.CharField(max_length=50, help_text=_("The category ID of the dining venue"))
    name = models.CharField(max_length=255, help_text=_("The name of the dining venue"))
    url = models.URLField(max_length=500, help_text=_("The URL of the dining venue"))

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        """Meta class for the DiningLocation model."""

        db_table = "dining_locations"
        indexes = [
            models.Index(fields=["id"]),
            models.Index(fields=["category"]),
            models.Index(fields=["name"]),
        ]

    def __str__(self):
        """Return the string representation of the DiningLocation instance."""
        return f"{self.name} ({self.id})"

"""Dining locations scraped from menus.princeton.edu."""

from django.db import models


class DiningLocation(models.Model):
    """A residential dining hall or retail cafe."""

    id = models.CharField(max_length=50, primary_key=True, help_text="API's location identifier")
    category = models.CharField(max_length=50, help_text="The category ID of the dining venue")
    name = models.CharField(max_length=255, help_text="The name of the dining venue")
    url = models.URLField(max_length=500, help_text="The URL of the dining venue")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "dining_locations"
        indexes = [
            models.Index(fields=["id"]),
            models.Index(fields=["category"]),
            models.Index(fields=["name"]),
        ]

    def __str__(self):
        return f"{self.name} ({self.id})"

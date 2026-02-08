"""Django models related to dining menus.

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
from django.utils import timezone
from hoagiemeal.models.dining import DiningLocation
from hoagiemeal.models.user import CustomUser
from django.contrib.auth import get_user_model

User = get_user_model()


class ResidentialMenu(models.Model):
    """Represent a daily menu for a specific meal at a dining location.

    Attributes:
        dining_location (DiningLocation): The dining location that the menu is for.
        date (DateField): The date of the menu.
        meal (CharField): The meal type of the menu.
        menu_items (JSONField): The menu items that are on the menu.

        created_at (DateTimeField): The date and time the menu was created.
        updated_at (DateTimeField): The date and time the menu was last updated.

    """

    dining_location = models.ForeignKey(DiningLocation, on_delete=models.CASCADE, related_name="residential_menus")
    date = models.DateField(default=timezone.now, db_index=True)
    meal = models.CharField(max_length=50, db_index=True)
    menu_items = models.JSONField(default=dict)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        """Meta class for the ResidentialMenu model."""

        db_table = "residential_menus"
        unique_together = ("dining_location", "date", "meal")
        indexes = [
            models.Index(fields=["dining_location", "date", "meal"]),
        ]

    def __str__(self):
        """Return the string representation of the ResidentialMenu instance."""
        return f"{self.dining_location.name} - {self.get_meal_display()} on {self.date}"


class RetailMenu(models.Model):
    """Represent a daily menu for a specific meal at a retail location.

    Attributes:
        dining_location (DiningLocation): The dining location that the menu is for.
        date (DateField): The date of the menu.
        menu_items (JSONField): The menu items that are on the menu.

        created_at (DateTimeField): The date and time the menu was created.
        updated_at (DateTimeField): The date and time the menu was last updated.

    """

    dining_location = models.ForeignKey(DiningLocation, on_delete=models.CASCADE, related_name="retail_menus")
    date = models.DateField(default=timezone.now, db_index=True)
    menu_items = models.JSONField(default=dict)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        """Meta class for the RetailMenu model."""

        db_table = "retail_menus"
        unique_together = ("dining_location", "date")
        indexes = [
            models.Index(fields=["dining_location", "date"]),
        ]

    def __str__(self):
        """Return the string representation of the RetailMenu instance."""
        return f"{self.dining_location.name} on {self.date}"

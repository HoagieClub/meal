"""Django models related to dining menu items.

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


class MenuItem(models.Model):
    """Single dining food item without nutrition info.

    Attributes:
        item_id (CharField): The unique identifier for the menu item.
        name (CharField): The name of the menu item.
        url (URLField): The URL of the menu item.
        created_at (DateTimeField): The date and time the menu item was created.
        updated_at (DateTimeField): The date and time the menu item was last updated.

    """

    id = models.CharField(max_length=20, primary_key=True)
    name = models.CharField(max_length=255, null=True, blank=True)
    url = models.URLField(max_length=500, null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        """Meta class for the MenuItem model."""

        db_table = "menu_items"
        indexes = [
            models.Index(fields=["id"]),
            models.Index(fields=["name"]),
        ]

    def __str__(self):
        """Return the string representation of the MenuItem instance."""
        return f"{self.name} ({self.id})"


class MenuItemNutrition(models.Model):
    """Nutrition facts for a MenuItem.

    Attributes:
        menu_item (OneToOneField): The menu item that the nutrition is for.
        servings_per_container (FloatField): The number of servings per container.
        serving_size (CharField): The size of the serving.
        calories (FloatField): The number of calories in the serving.
        total_fat (FloatField): The number of total fat in the serving.
        total_fat_dv (FloatField): The number of total fat in the serving.
        saturated_fat (FloatField): The number of saturated fat in the serving.
        saturated_fat_dv (FloatField): The number of saturated fat in the serving.
        trans_fat (FloatField): The number of trans fat in the serving.
        cholesterol (FloatField): The number of cholesterol in the serving.
        cholesterol_dv (FloatField): The number of cholesterol in the serving.
        sodium (FloatField): The number of sodium in the serving.
        sodium_dv (FloatField): The number of sodium in the serving.
        total_carbs (FloatField): The number of total carbs in the serving.
        total_carbs_dv (FloatField): The number of total carbs in the serving.
        dietary_fiber (FloatField): The number of dietary fiber in the serving.
        dietary_fiber_dv (FloatField): The number of dietary fiber in the serving.
        total_sugars (FloatField): The number of total sugars in the serving.
        added_sugars (FloatField): The number of added sugars in the serving.
        added_sugars_dv (FloatField): The number of added sugars in the serving.
        protein (FloatField): The number of protein in the serving.
        protein_dv (FloatField): The number of protein in the serving.
        vitamin_d (FloatField): The number of vitamin D in the serving.
        vitamin_d_dv (FloatField): The number of vitamin D in the serving.
        calcium (FloatField): The number of calcium in the serving.
        calcium_dv (FloatField): The number of calcium in the serving.
        iron (FloatField): The number of iron in the serving.
        iron_dv (FloatField): The number of iron in the serving.
        potassium (FloatField): The number of potassium in the serving.
        potassium_dv (FloatField): The number of potassium in the serving.
        ingredients (TextField): The ingredients of the menu item.
        allergens (TextField): The allergens of the menu item.
        raw (JSONField): The raw data of the nutrition.

        updated_at (DateTimeField): The date and time the nutrition was last updated.
        created_at (DateTimeField): The date and time the nutrition was created.

    """

    menu_item = models.OneToOneField(
        MenuItem,
        on_delete=models.CASCADE,
        related_name="nutrition",
        primary_key=True,
    )
    servings_per_container = models.FloatField(null=True, blank=True)
    serving_size = models.CharField(max_length=50, blank=True, null=True)
    calories = models.FloatField(null=True, blank=True)
    total_fat = models.FloatField(null=True, blank=True)
    total_fat_dv = models.FloatField(null=True, blank=True)
    saturated_fat = models.FloatField(null=True, blank=True)
    saturated_fat_dv = models.FloatField(null=True, blank=True)
    trans_fat = models.FloatField(null=True, blank=True)
    cholesterol = models.FloatField(null=True, blank=True)
    cholesterol_dv = models.FloatField(null=True, blank=True)
    sodium = models.FloatField(null=True, blank=True)
    sodium_dv = models.FloatField(null=True, blank=True)
    total_carbs = models.FloatField(null=True, blank=True)
    total_carbs_dv = models.FloatField(null=True, blank=True)
    dietary_fiber = models.FloatField(null=True, blank=True)
    dietary_fiber_dv = models.FloatField(null=True, blank=True)
    total_sugars = models.FloatField(null=True, blank=True)
    added_sugars = models.FloatField(null=True, blank=True)
    added_sugars_dv = models.FloatField(null=True, blank=True)
    protein = models.FloatField(null=True, blank=True)
    protein_dv = models.FloatField(null=True, blank=True)
    vitamin_d = models.FloatField(null=True, blank=True)
    vitamin_d_dv = models.FloatField(null=True, blank=True)
    calcium = models.FloatField(null=True, blank=True)
    calcium_dv = models.FloatField(null=True, blank=True)
    iron = models.FloatField(null=True, blank=True)
    iron_dv = models.FloatField(null=True, blank=True)
    potassium = models.FloatField(null=True, blank=True)
    potassium_dv = models.FloatField(null=True, blank=True)
    ingredients = models.TextField(blank=True, null=True)
    allergens = models.TextField(blank=True, null=True)
    updated_at = models.DateTimeField(auto_now=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        """Meta class for the MenuItemNutrition model."""

        db_table = "menu_item_nutrition"
        indexes = [
            models.Index(fields=["menu_item"]),
        ]

    def __str__(self):
        """Return the string representation of the MenuItemNutrition instance."""
        return f"Nutrition for {self.menu_item.name}"

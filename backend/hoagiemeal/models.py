"""Web scraper for extracting and structuring menu item information.

Copyright © 2021-2024 Hoagie Club and affiliates.

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
from django.contrib.auth.models import AbstractUser
from django.core.validators import MinValueValidator, MaxValueValidator
from django.utils import timezone
from django.contrib.postgres.fields import ArrayField
from django.utils.translation import gettext_lazy as _
from pgvector.django import VectorField


class CustomUser(AbstractUser):
    """HoagieMeal user."""

    net_id = models.CharField(
        max_length=20, unique=True, null=True, blank=True, db_index=True, help_text=_("University NetID")
    )
    class_year = models.PositiveSmallIntegerField(
        null=True, blank=True, validators=[MinValueValidator(1900), MaxValueValidator(2100)]
    )
    dietary_restrictions = ArrayField(
        models.CharField(max_length=50),
        blank=True,
        default=list,
        help_text=_("List of dietary restrictions/preferences"),
    )
    daily_calorie_target = models.PositiveSmallIntegerField(
        null=True, blank=True, validators=[MaxValueValidator(10000)]
    )
    daily_protein_target = models.PositiveSmallIntegerField(
        null=True, blank=True, validators=[MaxValueValidator(1000)]
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "users"
        verbose_name = _("user")
        verbose_name_plural = _("users")

    def __str__(self):
        return f"{self.get_full_name()} ({self.net_id})"


class DiningHall(models.Model):
    """Represents a dining facility on campus. Maps to the dining API's location data."""

    name = models.CharField(max_length=255, unique=True)
    map_name = models.CharField(max_length=255)
    database_id = models.PositiveIntegerField(unique=True, help_text=_("API's location identifier"))
    latitude = models.DecimalField(max_digits=9, decimal_places=6)
    longitude = models.DecimalField(max_digits=9, decimal_places=6)
    building_name = models.CharField(max_length=255)
    amenities = ArrayField(models.CharField(max_length=100), blank=True, default=list)
    is_active = models.BooleanField(default=True, help_text=_("Whether this dining hall is currently operational"))
    operation_hours = models.JSONField(null=True, blank=True, help_text=_("Operating hours in JSON format"))
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "dining_halls"
        indexes = [
            models.Index(fields=["database_id"]),
            models.Index(fields=["name"]),
        ]

    def __str__(self):
        return f"{self.name} ({self.building_name})"


class Menu(models.Model):
    """Represents a daily menu for a specific meal at a dining hall."""

    class MealType(models.TextChoices):
        BREAKFAST = "BR", _("Breakfast")
        LUNCH = "LU", _("Lunch")
        DINNER = "DI", _("Dinner")

    dining_hall = models.ForeignKey(DiningHall, on_delete=models.CASCADE, related_name="menus")
    date = models.DateField(default=timezone.now, db_index=True)
    meal = models.CharField(max_length=2, choices=MealType.choices, db_index=True)
    last_fetched = models.DateTimeField(auto_now=True, help_text=_("Last time menu was updated from API"))

    class Meta:
        db_table = "menus"
        unique_together = ("dining_hall", "date", "meal")
        indexes = [
            models.Index(fields=["dining_hall", "date", "meal"]),
        ]

    def __str__(self):
        return f"{self.dining_hall.name} - {self.get_meal_display()} on {self.date}"


class MenuItem(models.Model):
    """Core food item model representing a dish served in dining halls."""

    id = models.BigAutoField(primary_key=True)
    api_id = models.PositiveIntegerField(unique=True, help_text=_("Original menu item ID from the API"))
    menu = models.ForeignKey(Menu, on_delete=models.CASCADE, related_name="menu_items")
    name = models.CharField(max_length=255, db_index=True)
    description = models.TextField(blank=True)
    link = models.URLField(max_length=500, blank=True)
    allergens = ArrayField(models.CharField(max_length=100), blank=True, default=list)
    ingredients = ArrayField(models.CharField(max_length=255), blank=True, default=list)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "menu_items"
        indexes = [
            models.Index(fields=["name"]),
            models.Index(fields=["api_id"]),
        ]

    def __str__(self):
        return f"{self.name} ({self.api_id})"


class MenuItemNutrient(models.Model):
    """Detailed nutritional information for menu items."""

    menu_item = models.OneToOneField(MenuItem, on_delete=models.CASCADE, related_name="nutrient_info")
    serving_size = models.CharField(max_length=50, blank=True)
    serving_unit = models.CharField(max_length=20, blank=True)
    calories = models.PositiveSmallIntegerField(null=True, blank=True, db_index=True)
    calories_from_fat = models.PositiveSmallIntegerField(null=True, blank=True)
    total_fat = models.DecimalField(max_digits=6, decimal_places=2, null=True, blank=True)
    saturated_fat = models.DecimalField(max_digits=6, decimal_places=2, null=True, blank=True)
    trans_fat = models.DecimalField(max_digits=6, decimal_places=2, null=True, blank=True)
    cholesterol = models.DecimalField(max_digits=6, decimal_places=2, null=True, blank=True)
    sodium = models.DecimalField(max_digits=7, decimal_places=2, null=True, blank=True)
    total_carbohydrates = models.DecimalField(max_digits=6, decimal_places=2, null=True, blank=True)
    dietary_fiber = models.DecimalField(max_digits=6, decimal_places=2, null=True, blank=True)
    sugars = models.DecimalField(max_digits=6, decimal_places=2, null=True, blank=True)
    protein = models.DecimalField(max_digits=6, decimal_places=2, null=True, blank=True, db_index=True)
    vitamin_d = models.DecimalField(max_digits=6, decimal_places=2, null=True, blank=True)
    potassium = models.DecimalField(max_digits=6, decimal_places=2, null=True, blank=True)
    calcium = models.DecimalField(max_digits=6, decimal_places=2, null=True, blank=True)
    iron = models.DecimalField(max_digits=6, decimal_places=2, null=True, blank=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "menu_item_nutrients"
        indexes = [
            models.Index(fields=["calories"]),
            models.Index(fields=["protein"]),
        ]

    def __str__(self):
        return f"Nutrients for {self.menu_item.name}"


class UserMealLog(models.Model):
    """Tracks user meal consumption with portion sizes and timestamps."""

    user = models.ForeignKey(CustomUser, on_delete=models.CASCADE, related_name="meal_logs")
    menu_item = models.ForeignKey(MenuItem, on_delete=models.CASCADE, related_name="consumption_logs")
    portions = models.DecimalField(
        max_digits=4,
        decimal_places=2,
        default=1.0,
        validators=[MinValueValidator(0.1), MaxValueValidator(10.0)],
        help_text=_("Number of servings consumed"),
    )
    consumed_at = models.DateTimeField(default=timezone.now, db_index=True)
    meal_type = models.CharField(max_length=2, choices=Menu.MealType.choices)
    notes = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "user_meal_logs"
        indexes = [
            models.Index(fields=["user", "consumed_at"]),
            models.Index(fields=["consumed_at"]),
        ]

    def __str__(self):
        return f"{self.user.get_full_name()} - {self.menu_item.name} ({self.portions} servings)"


class FoodVector(models.Model):
    """Stores vector embeddings for menu items to power ML-based recommendations."""

    menu_item = models.OneToOneField(MenuItem, on_delete=models.CASCADE, related_name="food_vector")
    vector = VectorField(
        dimensions=384,  # Using BERT-like embedding size
        help_text=_("Vector embedding of menu item characteristics"),
    )
    last_updated = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "food_vectors"
        indexes = [
            models.Index(fields=["vector"], name="food_vector_idx", opclasses=["vector_ops"]),
        ]

    def __str__(self):
        return f"Vector for {self.menu_item.name}"


class MenuItemMetrics(models.Model):
    """Aggregated metrics and cached computations for menu items. Updated periodically via celery tasks."""

    menu_item = models.OneToOneField(MenuItem, on_delete=models.CASCADE, related_name="metrics")
    times_served = models.PositiveIntegerField(default=0)
    times_consumed = models.PositiveIntegerField(default=0)
    avg_portion_size = models.DecimalField(max_digits=4, decimal_places=2, null=True, blank=True)
    popularity_score = models.DecimalField(
        max_digits=5, decimal_places=2, default=0.0, help_text=_("Calculated score based on consumption patterns")
    )
    seasonal_availability = ArrayField(
        models.PositiveSmallIntegerField(), size=12, help_text=_("Monthly availability pattern (1-12)")
    )
    last_served = models.DateField(null=True, blank=True)
    common_pairings = ArrayField(
        models.BigIntegerField(), blank=True, default=list, help_text=_("IDs of commonly co-consumed menu items")
    )
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "menu_item_metrics"
        indexes = [
            models.Index(fields=["popularity_score"]),
            models.Index(fields=["times_consumed"]),
            models.Index(fields=["last_served"]),
        ]

    def __str__(self):
        return f"Metrics for {self.menu_item.name}"


class UserDietaryProfile(models.Model):
    """Detailed dietary profile for personalized recommendations."""

    user = models.OneToOneField(CustomUser, on_delete=models.CASCADE, related_name="dietary_profile")
    favorite_menu_items = models.ManyToManyField(MenuItem, related_name="favorited_by")
    excluded_ingredients = ArrayField(models.CharField(max_length=100), blank=True, default=list)
    preferred_dining_halls = models.ManyToManyField(DiningHall, related_name="preferred_by")
    cuisine_preferences = models.JSONField(default=dict, help_text=_("Weighted cuisine type preferences"))
    meal_time_preferences = models.JSONField(default=dict, help_text=_("Preferred dining times"))
    sustainability_preference = models.BooleanField(default=False, help_text=_("Preference for sustainable options"))
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "user_dietary_profiles"

    def __str__(self):
        return f"Dietary Profile - {self.user.get_full_name()}"

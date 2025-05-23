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
from django.core.validators import MinValueValidator, MaxValueValidator

from hoagiemeal.models.dining import DiningVenue

class Menu(models.Model):
    """Represent a daily menu for a specific meal at a dining hall.

    Attributes:
        dining_hall (DiningVenue): Associated dining hall.
    """

    class MealType(models.TextChoices):
        """Meal type choices for the Menu model."""

        BREAKFAST = "BR", _("Breakfast")
        LUNCH = "LU", _("Lunch")
        DINNER = "DI", _("Dinner")

    dining_hall = models.ForeignKey(DiningVenue, on_delete=models.CASCADE, related_name="menus")
    date = models.DateField(default=timezone.now, db_index=True)
    meal = models.CharField(max_length=2, choices=MealType.choices, db_index=True)
    last_fetched = models.DateTimeField(auto_now=True, help_text=_("Last time menu was updated from API"))

    class Meta:
        """Meta class for the Menu model."""

        db_table = "menus"
        unique_together = ("dining_hall", "date", "meal")
        indexes = [
            models.Index(fields=["dining_hall", "date", "meal"]),
        ]

    def __str__(self):
        """Return the string representation of the Menu instance.

        Returns:
            str: A formatted string with the dining hall name, meal type, and date.

        """
        return f"{self.dining_hall.name} - {self.get_meal_display()} on {self.date}"


class MenuItem(models.Model):
    """Represent a dish served in dining halls.

    Attributes:
        id (int): Primary key.
        api_id (int): Original menu item ID from the external API.
        menu (Menu): The menu this item belongs to.
        name (str): Name of the menu item.
        description (str): Description of the dish.
        link (str): URL linking to more details about the dish.
        allergens (list of str): List of allergens present.
        ingredients (list of str): List of ingredients used.
        created_at (datetime): Timestamp when the record was created.
        updated_at (datetime): Timestamp when the record was last updated.

    """

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
        """Meta class for the MenuItem model."""

        db_table = "menu_items"
        indexes = [
            models.Index(fields=["name"]),
            models.Index(fields=["api_id"]),
        ]

    def __str__(self):
        """Return the string representation of the MenuItem instance.

        Returns:
            str: The menu item name along with its API ID.

        """
        return f"{self.name} ({self.api_id})"


class MenuItemNutrient(models.Model):
    """Provide detailed nutritional information for a menu item.

    Attributes:
        menu_item (MenuItem): Associated menu item.
        serving_size (str): Serving size description.
        serving_unit (str): Unit for the serving size.
        calories (int): Total calories per serving.
        calories_from_fat (int): Calories derived from fat.
        total_fat (float): Total fat content.
        saturated_fat (float): Saturated fat content.
        trans_fat (float): Trans fat content.
        cholesterol (float): Cholesterol content.
        sodium (float): Sodium content.
        total_carbohydrates (float): Total carbohydrates content.
        dietary_fiber (float): Dietary fiber content.
        sugars (float): Sugar content.
        protein (float): Protein content.
        vitamin_d (float): Vitamin D content.
        potassium (float): Potassium content.
        calcium (float): Calcium content.
        iron (float): Iron content.
        updated_at (datetime): Timestamp when the nutrient information was last updated.

    """

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
        """Meta class for the MenuItemNutrient model."""

        db_table = "menu_item_nutrients"
        indexes = [
            models.Index(fields=["calories"]),
            models.Index(fields=["protein"]),
        ]

    def __str__(self):
        """Return the string representation of the MenuItemNutrient instance.

        Returns:
            str: Nutritional details linked to the menu item.

        """
        return f"Nutrients for {self.menu_item.name}"


class MenuItemMetrics(models.Model):
    """Aggregate metrics and cached computations for menu items.

    Updated periodically via celery tasks.

    Attributes:
        menu_item (MenuItem): Associated menu item.
        times_served (int): Number of times the item has been served.
        times_consumed (int): Number of times the item has been consumed.
        avg_portion_size (float): Average portion size consumed.
        popularity_score (float): Calculated popularity score.
        seasonal_availability (list of int): Monthly availability pattern (1-12).
        last_served (date): Last date the item was served.
        common_pairings (list of int): IDs of commonly co-consumed menu items.
        updated_at (datetime): Timestamp when the metrics were last updated.

    """

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
        """Meta class for the MenuItemMetrics model."""

        db_table = "menu_item_metrics"
        indexes = [
            models.Index(fields=["popularity_score"]),
            models.Index(fields=["times_consumed"]),
            models.Index(fields=["last_served"]),
        ]

    def __str__(self):
        """Return the string representation of the MenuItemMetrics instance.

        Returns:
            str: A summary string linking metrics to the associated menu item.

        """
        return f"Metrics for {self.menu_item.name}"

# TODO: Should probably be used somewhere
class MenuRating(models.Model):
    """Stores user ratings for menu items.

    Attributes:
        user (CustomUser): The user who provided the rating.
        menu_item (MenuItem): The menu item being rated.
        rating (float): User's rating of the menu item (1.0-5.0).
        comment (str): Optional user comment about the menu item.
        created_at (datetime): When the rating was created.
        updated_at (datetime): When the rating was last updated.
        is_anonymous (bool): Whether the rating should be displayed anonymously.
        dining_experience (str): The overall dining experience context.
        taste_rating (float): Specific rating for taste (1.0-5.0).
        presentation_rating (float): Specific rating for presentation (1.0-5.0).
        value_rating (float): Specific rating for value/portion size (1.0-5.0).

    """

    class DiningExperience(models.TextChoices):
        """Dining experience choices for the MenuRating model."""

        DINE_IN = "DI", _("Dine In")
        TAKE_OUT = "TO", _("Take Out")
        LATE_MEAL = "LM", _("Late Meal")
        SPECIAL_EVENT = "SE", _("Special Event")

    user = models.ForeignKey(
        "CustomUser",
        on_delete=models.CASCADE,
        related_name="menu_ratings",
        help_text=_("User who provided the rating"),
    )
    menu_item = models.ForeignKey(
        MenuItem, on_delete=models.CASCADE, related_name="ratings", help_text=_("Menu item being rated")
    )
    rating = models.FloatField(
        validators=[MinValueValidator(1.0), MaxValueValidator(5.0)],
        help_text=_("Overall rating of the menu item (1.0-5.0)"),
    )
    comment = models.TextField(blank=True, help_text=_("Optional user comment about the menu item"))
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    is_anonymous = models.BooleanField(
        default=False, help_text=_("Whether the rating should be displayed anonymously")
    )
    dining_experience = models.CharField(
        max_length=2,
        choices=DiningExperience.choices,
        default=DiningExperience.DINE_IN,
        help_text=_("The overall dining experience context"),
    )
    taste_rating = models.FloatField(
        null=True,
        blank=True,
        validators=[MinValueValidator(1.0), MaxValueValidator(5.0)],
        help_text=_("Specific rating for taste (1.0-5.0)"),
    )
    presentation_rating = models.FloatField(
        null=True,
        blank=True,
        validators=[MinValueValidator(1.0), MaxValueValidator(5.0)],
        help_text=_("Specific rating for presentation (1.0-5.0)"),
    )
    value_rating = models.FloatField(
        null=True,
        blank=True,
        validators=[MinValueValidator(1.0), MaxValueValidator(5.0)],
        help_text=_("Specific rating for value/portion size (1.0-5.0)"),
    )

    class Meta:
        """Meta class for the MenuRating model."""

        db_table = "menu_ratings"
        unique_together = ["user", "menu_item"]
        indexes = [
            models.Index(fields=["user"]),
            models.Index(fields=["menu_item"]),
            models.Index(fields=["rating"]),
            models.Index(fields=["created_at"]),
            models.Index(fields=["dining_experience"]),
        ]
        ordering = ["-created_at"]

    def __str__(self):
        """Return the string representation of the MenuRating instance.

        Returns:
            str: A description of the rating.

        """
        return f"Rating {self.rating} for {self.menu_item.name} by {self.user.get_full_name()}"

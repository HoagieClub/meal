"""Django models for the Hoagie Meal database schema.

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
from django.contrib.auth.models import AbstractUser
from django.core.validators import MinValueValidator, MaxValueValidator
from django.utils import timezone
from django.contrib.postgres.fields import ArrayField
from django.utils.translation import gettext_lazy as _
from pgvector.django import VectorField


class CustomUser(AbstractUser):
    """Extend user model for the Hoagie Meal application.

    Inherits from Django's AbstractUser to include additional
    attributes relevant to dietary tracking.

    Attributes:
        net_id (str): University NetID; unique identifier for campus users.
        class_year (int): Expected graduation year, validated between 1900 and 2100.
        dietary_restrictions (list of str): List of dietary restrictions/preferences.
        daily_calorie_target (int): Target daily calorie intake (max 10000).
        daily_protein_target (int): Target daily protein intake (max 1000).
        created_at (datetime): Timestamp when the record was created.
        updated_at (datetime): Timestamp when the record was last updated.

    """

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
        """Meta class for the CustomUser model."""

        db_table = "users"
        verbose_name = _("user")
        verbose_name_plural = _("users")

    def __str__(self):
        """Return the string representation of the CustomUser instance.

        Returns:
            str: The user's full name and net_id.

        """
        return f"{self.get_full_name()} ({self.net_id})"


class DiningHall(models.Model):
    """Represent a dining facility on campus.

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
        operation_hours (dict): Operating hours in JSON format.
        created_at (datetime): Timestamp when the record was created.
        updated_at (datetime): Timestamp when the record was last updated.

    """

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
        """Meta class for the DiningHall model."""

        db_table = "dining_halls"
        indexes = [
            models.Index(fields=["database_id"]),
            models.Index(fields=["name"]),
        ]

    def __str__(self):
        """Return the string representation of the DiningHall instance.

        Returns:
            str: The dining hall name along with the building name.

        """
        return f"{self.name} ({self.building_name})"


class Menu(models.Model):
    """Represent a daily menu for a specific meal at a dining hall.

    Attributes:
        dining_hall (DiningHall): Associated dining hall.
        date (date): Date for which the menu is applicable.
        meal (str): Meal type code (e.g., "BR" for Breakfast).
        last_fetched (datetime): Timestamp when the menu was last updated from the API.

    """

    class MealType(models.TextChoices):
        """Meal type choices for the Menu model."""

        BREAKFAST = "BR", _("Breakfast")
        LUNCH = "LU", _("Lunch")
        DINNER = "DI", _("Dinner")

    dining_hall = models.ForeignKey(DiningHall, on_delete=models.CASCADE, related_name="menus")
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


class UserMealLog(models.Model):
    """Track user meal consumption including portion sizes and timestamps.

    Attributes:
        user (CustomUser): User who consumed the meal.
        menu_item (MenuItem): The consumed menu item.
        portions (float): Number of servings consumed.
        consumed_at (datetime): Timestamp when the meal was consumed.
        meal_type (str): Meal type code corresponding to the Menu.MealType choices.
        notes (str): Additional notes about the meal consumption.
        created_at (datetime): Timestamp when the log was created.

    """

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
        """Meta class for the UserMealLog model."""

        db_table = "user_meal_logs"
        indexes = [
            models.Index(fields=["user", "consumed_at"]),
            models.Index(fields=["consumed_at"]),
        ]

    def __str__(self):
        """Return the string representation of the UserMealLog instance.

        Returns:
            str: A formatted string with the user's name, menu item name, and portions consumed.

        """
        return f"{self.user.get_full_name()} - {self.menu_item.name} ({self.portions} servings)"


class FoodVector(models.Model):
    """Store vector embeddings for menu items to power machine learning recommendations.

    Attributes:
        menu_item (MenuItem): Associated menu item.
        vector (VectorField): Vector embedding representing menu item characteristics.
        last_updated (datetime): Timestamp when the vector was last updated.

    """

    menu_item = models.OneToOneField(MenuItem, on_delete=models.CASCADE, related_name="food_vector")
    vector = VectorField(
        dimensions=384,  # Using BERT-like embedding size
        help_text=_("Vector embedding of menu item characteristics"),
    )
    last_updated = models.DateTimeField(auto_now=True)

    class Meta:
        """Meta class for the FoodVector model."""

        db_table = "food_vectors"
        indexes = [
            models.Index(fields=["vector"], name="food_vector_idx", opclasses=["vector_ops"]),
        ]

    def __str__(self):
        """Return the string representation of the FoodVector instance.

        Returns:
            str: A brief description linking the vector to its menu item.

        """
        return f"Vector for {self.menu_item.name}"


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


class UserDietaryProfile(models.Model):
    """Detail dietary profile for personalized recommendations.

    Attributes:
        user (CustomUser): Associated user.
        favorite_menu_items (QuerySet[MenuItem]): Menu items marked as favorites.
        excluded_ingredients (list of str): Ingredients the user wishes to avoid.
        preferred_dining_halls (QuerySet[DiningHall]): Dining halls preferred by the user.
        cuisine_preferences (dict): Weighted cuisine type preferences.
        meal_time_preferences (dict): Preferred dining times.
        sustainability_preference (bool): Preference for sustainable options.
        updated_at (datetime): Timestamp when the profile was last updated.

    """

    user = models.OneToOneField(CustomUser, on_delete=models.CASCADE, related_name="dietary_profile")
    favorite_menu_items = models.ManyToManyField(MenuItem, related_name="favorited_by")
    excluded_ingredients = ArrayField(models.CharField(max_length=100), blank=True, default=list)
    preferred_dining_halls = models.ManyToManyField(DiningHall, related_name="preferred_by")
    cuisine_preferences = models.JSONField(default=dict, help_text=_("Weighted cuisine type preferences"))
    meal_time_preferences = models.JSONField(default=dict, help_text=_("Preferred dining times"))
    sustainability_preference = models.BooleanField(default=False, help_text=_("Preference for sustainable options"))
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        """Meta class for the UserDietaryProfile model."""

        db_table = "user_dietary_profiles"

    def __str__(self):
        """Return the string representation of the UserDietaryProfile instance.

        Returns:
            str: A description linking the dietary profile to the user.

        """
        return f"Dietary Profile - {self.user.get_full_name()}"

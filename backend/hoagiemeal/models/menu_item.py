"""Menu items and their nutrition facts."""

from django.db import models


class MenuItem(models.Model):
    """A food item, keyed by the Campus Dining recipe number."""

    id = models.CharField(max_length=20, primary_key=True)
    name = models.CharField(max_length=255, null=True, blank=True)
    url = models.URLField(max_length=500, null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "menu_items"
        indexes = [
            models.Index(fields=["id"]),
            models.Index(fields=["name"]),
        ]

    def __str__(self):
        return f"{self.name} ({self.id})"


class MenuItemNutrition(models.Model):
    """Nutrition label for a menu item. `*_dv` fields are percent of the FDA daily value."""

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
        db_table = "menu_item_nutrition"
        indexes = [models.Index(fields=["menu_item"])]

    def __str__(self):
        return f"Nutrition for {self.menu_item.name}"

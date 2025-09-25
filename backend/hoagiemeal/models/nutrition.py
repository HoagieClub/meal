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
from django.core.validators import MinValueValidator, MaxValueValidator
from django.utils import timezone

from hoagiemeal.models.user import CustomUser
from hoagiemeal.models.menu import Menu, MenuItem


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


class NutritionGoalType(models.TextChoices):
    """Types of nutrition goals a user can set."""

    CALORIE_TARGET = "CT", _("Calorie Target")
    PROTEIN_TARGET = "PT", _("Protein Target")
    CARB_TARGET = "CB", _("Carbohydrate Target")
    FAT_TARGET = "FT", _("Fat Target")
    FIBER_TARGET = "FB", _("Fiber Target")
    SUGAR_LIMIT = "SL", _("Sugar Limit")
    SODIUM_LIMIT = "SO", _("Sodium Limit")
    CUSTOM_NUTRIENT = "CN", _("Custom Nutrient")


class UserGoal(models.Model):
    """Represents a nutritional or dietary goal set by a user.

    Attributes:
        user (CustomUser): The user who set the goal.
        goal_type (str): Type of goal (calorie, protein, etc.).
        target_value (float): Target value for the goal.
        current_value (float): Current progress toward the goal.
        unit (str): Unit of measurement (g, mg, kcal, etc.).
        is_active (bool): Whether the goal is currently active.
        start_date (date): When the goal was set.
        end_date (date): When the goal should be achieved (optional).
        current_streak (int): Days in a row the goal has been met.
        longest_streak (int): Longest streak of meeting this goal.
        custom_name (str): Name for custom goals.

    """

    user = models.ForeignKey(CustomUser, on_delete=models.CASCADE, related_name="goals")
    goal_type = models.CharField(
        max_length=2,
        choices=NutritionGoalType.choices,
        default=NutritionGoalType.CALORIE_TARGET,
    )
    target_value = models.FloatField(
        help_text=_("Target value for the goal"),
    )
    current_value = models.FloatField(
        default=0.0,
        help_text=_("Current progress toward the goal"),
    )
    unit = models.CharField(
        max_length=10,
        default="kcal",
        help_text=_("Unit of measurement (g, mg, kcal, etc.)"),
    )
    is_active = models.BooleanField(default=True)
    start_date = models.DateField(auto_now_add=True)
    end_date = models.DateField(null=True, blank=True)
    current_streak = models.PositiveIntegerField(default=0)
    longest_streak = models.PositiveIntegerField(default=0)
    custom_name = models.CharField(max_length=100, blank=True)

    class Meta:
        """Meta class for the UserGoal model."""

        db_table = "user_goals"
        indexes = [
            models.Index(fields=["user", "goal_type"]),
            models.Index(fields=["is_active"]),
            models.Index(fields=["current_streak"]),
        ]

    def __str__(self):
        """Return the string representation of the UserGoal instance.

        Returns:
            str: A description of the user's goal.

        """
        goal_name = self.custom_name if self.custom_name else self.get_goal_type_display()
        return f"{self.user.get_full_name()} - {goal_name}: {self.target_value} {self.unit}"


class DailyGoalProgress(models.Model):
    """Tracks daily progress toward a user's goals.

    Attributes:
        goal (UserGoal): The goal being tracked.
        date (date): The date for which progress is recorded.
        value (float): The value achieved on this date.
        goal_met (bool): Whether the goal was met on this date.
        notes (str): Any notes about this day's progress.

    """

    goal = models.ForeignKey(UserGoal, on_delete=models.CASCADE, related_name="daily_progress")
    date = models.DateField(default=timezone.now)
    value = models.FloatField(
        help_text=_("The value achieved on this date"),
    )
    goal_met = models.BooleanField(
        default=False,
        help_text=_("Whether the goal was met on this date"),
    )
    notes = models.TextField(blank=True)

    class Meta:
        """Meta class for the DailyGoalProgress model."""

        db_table = "daily_goal_progress"
        unique_together = ("goal", "date")
        indexes = [
            models.Index(fields=["goal", "date"]),
            models.Index(fields=["goal_met"]),
        ]

    def __str__(self):
        """Return the string representation of the DailyGoalProgress instance.

        Returns:
            str: A description of the daily goal progress.

        """
        status = "Met" if self.goal_met else "Not met"
        return f"{self.goal} - {self.date}: {self.value} ({status})"

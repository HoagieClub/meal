"""Django models related to the user.

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

from django.contrib.auth.models import AbstractUser
from django.db import models
from django.core.validators import MaxValueValidator, MinValueValidator
from django.utils.translation import gettext_lazy as _
from django.contrib.postgres.fields import ArrayField

from hoagiemeal.models.menu import MenuItem
from hoagiemeal.models.dining import DiningVenue


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


class UserDietaryProfile(models.Model):
    """Detail dietary profile for personalized recommendations.

    Attributes:
        user (CustomUser): Associated user.
        favorite_menu_items (QuerySet[MenuItem]): Menu items marked as favorites.
        excluded_ingredients (list of str): Ingredients the user wishes to avoid.
        preferred_dining_halls (QuerySet[DiningVenue]): Dining halls preferred by the user.
        cuisine_preferences (dict): Weighted cuisine type preferences.
        meal_time_preferences (dict): Preferred dining times.
        sustainability_preference (bool): Preference for sustainable options.
        updated_at (datetime): Timestamp when the profile was last updated.

    """

    user = models.OneToOneField(CustomUser, on_delete=models.CASCADE, related_name="dietary_profile")
    favorite_menu_items = models.ManyToManyField(MenuItem, related_name="favorited_by")
    excluded_ingredients = ArrayField(models.CharField(max_length=100), blank=True, default=list)
    preferred_dining_halls = models.ManyToManyField(DiningVenue, related_name="preferred_by")
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

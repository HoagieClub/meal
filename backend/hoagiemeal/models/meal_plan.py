"""Django models related to meal plans.

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

from hoagiemeal.models.user import CustomUser
from hoagiemeal.models.dining import DiningVenue
from hoagiemeal.models.menu import Menu


class MealPlanType(models.TextChoices):
    """Meal plan type choices available to users."""

    UNDERGRAD_UNLIMITED = "UU", _("Undergraduate Unlimited")
    UNDERGRAD_BLOCK_105 = "UB", _("Undergraduate Block 105")
    EATING_CLUB = "EC", _("Eating Club")
    INDEPENDENT = "IN", _("Independent")
    GRAD_STUDENT = "GS", _("Graduate Student")
    NONE = "NO", _("No Meal Plan")


class UserMealPlan(models.Model):
    """Tracks a user's meal plan details and remaining swipes.

    Attributes:
        user (CustomUser): The user this meal plan belongs to.
        plan_type (str): Type of meal plan the user is on.
        semester_start (date): Start date of the current semester.
        semester_end (date): End date of the current semester.
        total_swipes (int): Total number of swipes allocated for the semester.
        remaining_swipes (int): Number of swipes remaining.
        total_late_meal (int): Total late meal swipes allocated.
        remaining_late_meal (int): Number of late meal swipes remaining.
        daily_swipes_reset (bool): Whether swipes reset daily (unlimited plan).
        last_updated (datetime): When the swipe count was last updated.

    """

    user = models.OneToOneField(CustomUser, on_delete=models.CASCADE, related_name="meal_plan")
    plan_type = models.CharField(
        max_length=2,
        choices=MealPlanType.choices,
        default=MealPlanType.NONE,
        help_text=_("Type of meal plan the user is on"),
    )
    semester_start = models.DateField(
        null=True,
        blank=True,
        help_text=_("Start date of the current semester"),
    )
    semester_end = models.DateField(
        null=True,
        blank=True,
        help_text=_("End date of the current semester"),
    )
    total_swipes = models.PositiveIntegerField(
        default=0,
        help_text=_("Total number of swipes allocated for the semester"),
    )
    remaining_swipes = models.PositiveIntegerField(
        default=0,
        help_text=_("Number of swipes remaining"),
    )
    total_late_meal = models.PositiveIntegerField(
        default=0,
        help_text=_("Total late meal swipes allocated"),
    )
    remaining_late_meal = models.PositiveIntegerField(
        default=0,
        help_text=_("Number of late meal swipes remaining"),
    )
    daily_swipes_reset = models.BooleanField(
        default=False,
        help_text=_("Whether swipes reset daily (unlimited plan)"),
    )
    last_updated = models.DateTimeField(auto_now=True)

    class Meta:
        """Meta class for the UserMealPlan model."""

        db_table = "user_meal_plans"
        indexes = [
            models.Index(fields=["plan_type"]),
            models.Index(fields=["remaining_swipes"]),
            models.Index(fields=["remaining_late_meal"]),
        ]

    def __str__(self):
        """Return the string representation of the UserMealPlan instance.

        Returns:
            str: A description of the user's meal plan.

        """
        return f"{self.user.get_full_name()} - {self.get_plan_type_display()}"

    def reset_daily_swipes(self):
        """Reset swipes for unlimited meal plans.

        This should be called daily for users on unlimited plans.
        """
        if self.daily_swipes_reset and self.plan_type == MealPlanType.UNDERGRAD_UNLIMITED:
            self.remaining_swipes = 3  # Standard daily swipe count for unlimited
            self.save(update_fields=["remaining_swipes", "last_updated"])


class SwipeTransactionIndividual(models.Model):
    """Records individual swipe usage transactions.

    Attributes:
        user (CustomUser): User who used the swipe.
        dining_venue (DiningVenue): Where the swipe was used.
        transaction_time (datetime): When the swipe was used.
        is_late_meal (bool): Whether this was a late meal swipe.
        meal_type (str): Type of meal (breakfast, lunch, dinner).
        transaction_type (str): Type of transaction (use, refund, etc.).

    """

    class TransactionType(models.TextChoices):
        """Transaction type choices for the SwipeTransaction model."""

        USE = "US", _("Use")
        REFUND = "RF", _("Refund")
        TRANSFER_OUT = "TO", _("Transfer Out")
        TRANSFER_IN = "TI", _("Transfer In")
        ADMIN_ADJUSTMENT = "AA", _("Administrative Adjustment")

    user = models.ForeignKey(CustomUser, on_delete=models.CASCADE, related_name="swipe_transactions")
    dining_venue = models.ForeignKey(
        DiningVenue,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="swipe_transactions",
    )
    transaction_time = models.DateTimeField(auto_now_add=True, db_index=True)
    is_late_meal = models.BooleanField(
        default=False,
        help_text=_("Whether this was a late meal swipe"),
    )
    meal_type = models.CharField(
        max_length=2,
        choices=Menu.MealType.choices,
        null=True,
        blank=True,
    )
    transaction_type = models.CharField(
        max_length=2,
        choices=TransactionType.choices,
        default=TransactionType.USE,
    )
    notes = models.TextField(blank=True)

    class Meta:
        """Meta class for the SwipeTransaction model."""

        db_table = "swipe_transactions_individual"
        indexes = [
            models.Index(fields=["user", "transaction_time"]),
            models.Index(fields=["is_late_meal"]),
            models.Index(fields=["transaction_type"]),
        ]

    def __str__(self):
        """Return the string representation of the SwipeTransaction instance.

        Returns:
            str: A description of the swipe transaction.

        """
        tx_type = "Late Meal" if self.is_late_meal else "Regular"
        return f"{tx_type} swipe by {self.user.get_full_name()} at {self.transaction_time.strftime('%Y-%m-%d %H:%M')}"

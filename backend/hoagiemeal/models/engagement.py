"""Django models related to user engagement.

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
from pgvector.django import VectorField

from hoagiemeal.models.user import CustomUser
from hoagiemeal.models.menu import MenuItem


# class UserStreak(models.Model):
#     """Tracks a user's app usage streaks and engagement metrics.

#     Attributes:
#         user (CustomUser): The user whose streak is being tracked.
#         current_streak_days (int): Current consecutive days of app usage.
#         longest_streak_days (int): Longest streak achieved.
#         last_activity_date (date): Date of the user's last activity.
#         total_days_active (int): Total number of days the user has been active.
#         current_week_active_days (int): Number of active days in the current week.
#         streak_start_date (date): When the current streak started.

#     """

#     user = models.OneToOneField(CustomUser, on_delete=models.CASCADE, related_name="streak")
#     current_streak_days = models.PositiveIntegerField(default=0)
#     longest_streak_days = models.PositiveIntegerField(default=0)
#     last_activity_date = models.DateField(null=True, blank=True)
#     total_days_active = models.PositiveIntegerField(default=0)
#     current_week_active_days = models.PositiveIntegerField(default=0)
#     streak_start_date = models.DateField(null=True, blank=True)

#     class Meta:
#         """Meta class for the UserStreak model."""

#         db_table = "user_streaks"
#         indexes = [
#             models.Index(fields=["current_streak_days"]),
#             models.Index(fields=["longest_streak_days"]),
#             models.Index(fields=["last_activity_date"]),
#         ]

#     def __str__(self):
#         """Return the string representation of the UserStreak instance.

#         Returns:
#             str: A description of the user's streak.

#         """
#         return f"{self.user.get_full_name()} - {self.current_streak_days} day streak"

#     def record_activity(self, activity_date=None):
#         """Record user activity and update streak information.

#         Args:
#             activity_date: The date of the activity (defaults to today).

#         Returns:
#             bool: Whether the streak was incremented.

#         """
#         from datetime import date, timedelta

#         today = activity_date or date.today()

#         # First activity ever
#         if not self.last_activity_date:
#             self.current_streak_days = 1
#             self.longest_streak_days = 1
#             self.total_days_active = 1
#             self.current_week_active_days = 1
#             self.streak_start_date = today
#             self.last_activity_date = today
#             self.save()
#             return True

#         # Already recorded activity today
#         if self.last_activity_date == today:
#             return False

#         # Calculate days since last activity
#         days_since_last = (today - self.last_activity_date).days

#         # Continuing streak (activity yesterday)
#         if days_since_last == 1:
#             self.current_streak_days += 1
#             self.total_days_active += 1

#             # Update longest streak if current is longer
#             if self.current_streak_days > self.longest_streak_days:
#                 self.longest_streak_days = self.current_streak_days

#         # Missed a day, but still active
#         elif days_since_last > 1:
#             # Reset streak
#             self.current_streak_days = 1
#             self.streak_start_date = today
#             self.total_days_active += 1

#         # Update week counter
#         start_of_week = today - timedelta(days=today.weekday())
#         if self.last_activity_date < start_of_week:
#             self.current_week_active_days = 1
#         else:
#             self.current_week_active_days += 1

#         self.last_activity_date = today
#         self.save()
#         return True


# class UserPreferenceSnapshot(models.Model):
#     """Captures a snapshot of user preferences at a point in time.

#     Used to track how preferences change over time and adapt recommendations accordingly.

#     Attributes:
#         user (CustomUser): The user whose preferences are captured.
#         timestamp (datetime): When this snapshot was taken.
#         preference_vector (VectorField): Vector embedding of preferences.
#         active_interests (list): List of active interests at this time.
#         context (dict): Contextual information about when this snapshot was taken.
#         snapshot_type (str): Type of snapshot (periodic, event-triggered, etc.).

#     """

#     class SnapshotType(models.TextChoices):
#         """Snapshot type choices for the UserPreferenceSnapshot model."""

#         PERIODIC = "PE", _("Periodic")
#         EVENT_TRIGGERED = "ET", _("Event Triggered")
#         SEASONAL = "SE", _("Seasonal")
#         MAJOR_CHANGE = "MC", _("Major Change Detected")

#     user = models.ForeignKey(CustomUser, on_delete=models.CASCADE, related_name="preference_snapshots")
#     timestamp = models.DateTimeField(auto_now_add=True, db_index=True)
#     preference_vector = VectorField(
#         dimensions=384,  # Matching other vector dimensions
#         help_text=_("Vector embedding of preferences"),
#     )
#     active_interests = models.JSONField(
#         help_text=_("List of active interests at this time"),
#     )
#     context = models.JSONField(
#         default=dict,
#         blank=True,
#         help_text=_("Contextual information about when this snapshot was taken"),
#     )
#     snapshot_type = models.CharField(
#         max_length=2,
#         choices=SnapshotType.choices,
#         default=SnapshotType.PERIODIC,
#     )

#     class Meta:
#         """Meta class for the UserPreferenceSnapshot model."""

#         db_table = "user_preference_snapshots"
#         indexes = [
#             models.Index(
#                 fields=["preference_vector"], name="preference_snapshot_vector_idx", opclasses=["vector_ops"]
#             ),
#             models.Index(fields=["user", "timestamp"]),
#             models.Index(fields=["snapshot_type"]),
#         ]

#     def __str__(self):
#         """Return the string representation of the UserPreferenceSnapshot instance.

#         Returns:
#             str: A description of the snapshot.

#         """
#         return f"Preference snapshot for {self.user.get_full_name()} at {self.timestamp}"


# class PreferenceChangeEvent(models.Model):
#     """Records significant changes in user preferences.

#     Attributes:
#         user (CustomUser): The user whose preferences changed.
#         timestamp (datetime): When the change was detected.
#         previous_snapshot (UserPreferenceSnapshot): Snapshot before the change.
#         current_snapshot (UserPreferenceSnapshot): Snapshot after the change.
#         change_magnitude (float): Magnitude of the change (0.0-1.0).
#         change_description (str): Human-readable description of the change.
#         affected_interests (list): Interests affected by this change.

#     """

#     user = models.ForeignKey(CustomUser, on_delete=models.CASCADE, related_name="preference_changes")
#     timestamp = models.DateTimeField(auto_now_add=True, db_index=True)
#     previous_snapshot = models.ForeignKey(
#         UserPreferenceSnapshot,
#         on_delete=models.SET_NULL,
#         null=True,
#         related_name="changes_after",
#     )
#     current_snapshot = models.ForeignKey(
#         UserPreferenceSnapshot,
#         on_delete=models.SET_NULL,
#         null=True,
#         related_name="changes_before",
#     )
#     change_magnitude = models.FloatField(
#         validators=[MinValueValidator(0.0), MaxValueValidator(1.0)],
#         help_text=_("Magnitude of the change (0.0-1.0)"),
#     )
#     change_description = models.TextField(
#         blank=True,
#         help_text=_("Human-readable description of the change"),
#     )
#     affected_interests = models.JSONField(
#         default=list,
#         blank=True,
#         help_text=_("Interests affected by this change"),
#     )

#     class Meta:
#         """Meta class for the PreferenceChangeEvent model."""

#         db_table = "preference_change_events"
#         indexes = [
#             models.Index(fields=["user", "timestamp"]),
#             models.Index(fields=["change_magnitude"]),
#         ]

#     def __str__(self):
#         """Return the string representation of the PreferenceChangeEvent instance.

#         Returns:
#             str: A description of the preference change event.

#         """
#         return f"Preference change for {self.user.get_full_name()} at {self.timestamp} (magnitude: {self.change_magnitude:.2f})"


class MenuItemLike(models.Model):
    """Tracks user likes for menu items with source tracking.

    Allows users to like menu items from different sources (e.g., menu page,
    nutrition page, details modal) and unlike them by source. This enables
    tracking where likes come from for analytics and allows users to have
    multiple likes per menu item (one per source).

    Attributes:
        user (CustomUser): The user who liked the menu item.
        menu_item (MenuItem): The menu item that was liked.
        source (str): Where the like came from (e.g., "menu_page", "nutrition_page").
        created_at (datetime): When the like was created.
        updated_at (datetime): When the like was last updated.

    """

    class SourceType(models.TextChoices):
        """Source type choices for the MenuItemLike model."""

        MENU_PAGE = "MP", _("Menu Page")
        NUTRITION_PAGE = "NP", _("Nutrition Page")
        DETAILS_MODAL = "DM", _("Details Modal")
        SEARCH_RESULTS = "SR", _("Search Results")
        OTHER = "OT", _("Other")

    user = models.ForeignKey(
        CustomUser,
        on_delete=models.CASCADE,
        related_name="menu_item_likes",
        help_text=_("User who liked the menu item"),
    )
    menu_item = models.ForeignKey(
        MenuItem,
        on_delete=models.CASCADE,
        related_name="likes",
        help_text=_("Menu item that was liked"),
    )
    source = models.CharField(
        max_length=2,
        choices=SourceType.choices,
        default=SourceType.OTHER,
        help_text=_("Where the like came from"),
        db_index=True,
    )
    created_at = models.DateTimeField(auto_now_add=True, db_index=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        """Meta class for the MenuItemLike model."""

        db_table = "menu_item_likes"
        unique_together = [("user", "menu_item", "source")]
        indexes = [
            models.Index(fields=["user"]),
            models.Index(fields=["menu_item"]),
            models.Index(fields=["source"]),
            models.Index(fields=["created_at"]),
            models.Index(fields=["user", "menu_item"]),
        ]
        ordering = ["-created_at"]

    def __str__(self):
        """Return the string representation of the MenuItemLike instance.

        Returns:
            str: A description of the like.

        """
        return f"{self.user.get_full_name()} liked {self.menu_item.name} from {self.get_source_display()}"


class MenuItemFavorite(models.Model):
    """Tracks user favorites for menu items.

    Allows users to favorite menu items they like for quick access.
    This is separate from likes as it serves a different purpose:
    favorites are personal collections, while likes are social signals.

    Attributes:
        user (CustomUser): The user who favorited the menu item.
        menu_item (MenuItem): The menu item that was favorited.
        notes (str): Optional user notes about why they favorited this item.
        created_at (datetime): When the favorite was created.
        updated_at (datetime): When the favorite was last updated.

    """

    user = models.ForeignKey(
        CustomUser,
        on_delete=models.CASCADE,
        related_name="menu_item_favorites",
        help_text=_("User who favorited the menu item"),
    )
    menu_item = models.ForeignKey(
        MenuItem,
        on_delete=models.CASCADE,
        related_name="favorites",
        help_text=_("Menu item that was favorited"),
    )
    created_at = models.DateTimeField(auto_now_add=True, db_index=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        """Meta class for the MenuItemFavorite model."""

        db_table = "menu_item_favorites"
        unique_together = [("user", "menu_item")]
        indexes = [
            models.Index(fields=["user"]),
            models.Index(fields=["menu_item"]),
            models.Index(fields=["created_at"]),
            models.Index(fields=["user", "created_at"]),
        ]
        ordering = ["-created_at"]

    def __str__(self):
        """Return the string representation of the MenuItemFavorite instance.

        Returns:
            str: A description of the favorite.

        """
        return f"{self.user.get_full_name()} favorited {self.menu_item.name}"

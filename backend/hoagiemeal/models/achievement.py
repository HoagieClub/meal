"""Django models related to achievements and badges.

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

from hoagiemeal.models.user import CustomUser


class AchievementCategory(models.TextChoices):
    """Categories for user achievements."""

    DINING = "DI", _("Dining")
    NUTRITION = "NU", _("Nutrition")
    SOCIAL = "SO", _("Social")
    EXPLORATION = "EX", _("Exploration")
    CONSISTENCY = "CO", _("Consistency")
    SPECIAL = "SP", _("Special")


class Achievement(models.Model):
    """Defines achievements that users can earn.

    Attributes:
        name (str): Name of the achievement.
        description (str): Description of how to earn the achievement.
        category (str): Category of the achievement.
        points (int): Points awarded for earning this achievement.
        icon (str): Icon representing the achievement.
        is_hidden (bool): Whether the achievement is hidden until earned.
        is_rare (bool): Whether the achievement is considered rare.
        requirements (JSONField): JSON object describing requirements to earn.
        created_at (datetime): When the achievement was created.

    """

    name = models.CharField(max_length=100)
    description = models.TextField()
    category = models.CharField(
        max_length=2,
        choices=AchievementCategory.choices,
        default=AchievementCategory.DINING,
    )
    points = models.PositiveIntegerField(default=10)
    icon = models.CharField(max_length=100, blank=True)
    is_hidden = models.BooleanField(default=False)
    is_rare = models.BooleanField(default=False)
    requirements = models.JSONField(
        default=dict,
        help_text=_("JSON object describing requirements to earn"),
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        """Meta class for the Achievement model."""

        db_table = "achievements"
        indexes = [
            models.Index(fields=["category"]),
            models.Index(fields=["points"]),
            models.Index(fields=["is_rare"]),
        ]

    def __str__(self):
        """Return the string representation of the Achievement instance.

        Returns:
            str: The name of the achievement.

        """
        return f"{self.name} ({self.get_category_display()})"


class UserAchievement(models.Model):
    """Records achievements earned by users.

    Attributes:
        user (CustomUser): The user who earned the achievement.
        achievement (Achievement): The achievement earned.
        earned_at (datetime): When the achievement was earned.
        progress (float): Progress toward earning the achievement (0-100).
        is_displayed (bool): Whether the user displays this on their profile.

    """

    user = models.ForeignKey(CustomUser, on_delete=models.CASCADE, related_name="achievements")
    achievement = models.ForeignKey(Achievement, on_delete=models.CASCADE, related_name="user_achievements")
    earned_at = models.DateTimeField(auto_now_add=True)
    progress = models.FloatField(
        default=0.0,
        validators=[MinValueValidator(0.0), MaxValueValidator(100.0)],
        help_text=_("Progress toward earning the achievement (0-100)"),
    )
    is_displayed = models.BooleanField(default=True)

    class Meta:
        """Meta class for the UserAchievement model."""

        db_table = "user_achievements"
        unique_together = ("user", "achievement")
        indexes = [
            models.Index(fields=["user"]),
            models.Index(fields=["achievement"]),
            models.Index(fields=["earned_at"]),
        ]

    def __str__(self):
        """Return the string representation of the UserAchievement instance.

        Returns:
            str: A description of the user achievement.

        """
        return f"{self.user.get_full_name()} earned {self.achievement.name}"


class Badge(models.Model):
    """Special badges that can be displayed on user profiles.

    Attributes:
        name (str): Name of the badge.
        description (str): Description of the badge.
        icon (str): Icon representing the badge.
        is_limited (bool): Whether the badge is limited edition.
        requirements (JSONField): JSON object describing requirements to earn.
        expiry_date (date): When the badge expires (if applicable).

    """

    name = models.CharField(max_length=100)
    description = models.TextField()
    icon = models.CharField(max_length=100)
    is_limited = models.BooleanField(default=False)
    requirements = models.JSONField(
        default=dict,
        help_text=_("JSON object describing requirements to earn"),
    )
    expiry_date = models.DateField(null=True, blank=True)

    class Meta:
        """Meta class for the Badge model."""

        db_table = "badges"
        indexes = [
            models.Index(fields=["is_limited"]),
            models.Index(fields=["expiry_date"]),
        ]

    def __str__(self):
        """Return the string representation of the Badge instance.

        Returns:
            str: The name of the badge.

        """
        return self.name


class UserBadge(models.Model):
    """Records badges earned by users.

    Attributes:
        user (CustomUser): The user who earned the badge.
        badge (Badge): The badge earned.
        earned_at (datetime): When the badge was earned.
        is_displayed (bool): Whether the user displays this on their profile.
        expires_at (date): When the badge expires for this user.

    """

    user = models.ForeignKey(CustomUser, on_delete=models.CASCADE, related_name="badges")
    badge = models.ForeignKey(Badge, on_delete=models.CASCADE, related_name="user_badges")
    earned_at = models.DateTimeField(auto_now_add=True)
    is_displayed = models.BooleanField(default=True)
    expires_at = models.DateField(null=True, blank=True)

    class Meta:
        """Meta class for the UserBadge model."""

        db_table = "user_badges"
        unique_together = ("user", "badge")
        indexes = [
            models.Index(fields=["user"]),
            models.Index(fields=["badge"]),
            models.Index(fields=["earned_at"]),
            models.Index(fields=["expires_at"]),
        ]

    def __str__(self):
        """Return the string representation of the UserBadge instance.

        Returns:
            str: A description of the user badge.

        """
        return f"{self.user.get_full_name()} earned {self.badge.name}"

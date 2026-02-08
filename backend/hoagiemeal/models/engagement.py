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
from hoagiemeal.models.user import CustomUser
from django.contrib.auth import get_user_model
from hoagiemeal.models.menu_item import MenuItem
from hoagiemeal.models.menu import ResidentialMenu, RetailMenu
from hoagiemeal.models.dining import DiningLocation

User = get_user_model()


class MenuItemInteraction(models.Model):
    """Represents user interactions with a menu item.

    Attributes:
        user (CustomUser): The user who interacted with the menu item.
        menu_item (MenuItem): The menu item that was interacted with.

        viewed (bool): Whether the menu item was viewed.
        view_count (int): The number of times the menu item was viewed.
        first_viewed_at (datetime): The date and time the menu item was first viewed.
        last_viewed_at (datetime): The date and time the menu item was last viewed.
        liked (bool): Whether the menu item was liked.
        favorited (bool): Whether the menu item was favorited.
        saved_for_later (bool): Whether the menu item was saved for later.
        would_eat_again (str): Whether the menu item would be eaten again.

        created_at (datetime): The date and time the interaction was created.
        updated_at (datetime): The date and time the interaction was last updated.

    """

    class WouldEatAgain(models.TextChoices):
        """Would eat again choices for the MenuItemInteraction model."""

        YES = "Y", _("Yes")
        NO = "N", _("No")
        MAYBE = "M", _("Maybe")

    user = models.ForeignKey(
        CustomUser,
        on_delete=models.CASCADE,
        related_name="menu_item_interactions",
    )
    menu_item = models.ForeignKey(
        MenuItem,
        on_delete=models.CASCADE,
        related_name="user_interactions",
    )

    viewed = models.BooleanField(default=False)
    view_count = models.PositiveSmallIntegerField(default=0)
    first_viewed_at = models.DateTimeField(null=True, blank=True)
    last_viewed_at = models.DateTimeField(null=True, blank=True)
    liked = models.BooleanField(null=True, blank=True)
    favorited = models.BooleanField(default=False)
    saved_for_later = models.BooleanField(default=False)
    would_eat_again = models.CharField(max_length=1, choices=WouldEatAgain.choices, null=True, blank=True)

    updated_at = models.DateTimeField(auto_now=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        """Meta class for the MenuItemInteraction model."""

        constraints = [
            models.UniqueConstraint(
                fields=["user", "menu_item"],
                name="user_menu_item_interaction",
            )
        ]
        indexes = [
            models.Index(fields=["user"]),
            models.Index(fields=["menu_item"]),
        ]

    def __str__(self):
        """Return the string representation of the MenuItemInteraction instance."""
        return f"User {self.user.id} interacted with menu item {self.menu_item.id}"


class MenuItemMetrics(models.Model):
    """Aggregate metrics and cached computations for menu items.

    Attributes:
        menu_item (MenuItem): The menu item that the metrics are for.

        view_count (int): The number of times the menu item was viewed.
        unique_view_count (int): The number of unique users who viewed the menu item.
        like_count (int): The number of times the menu item was liked.
        dislike_count (int): The number of times the menu item was disliked.
        average_like_score (float): The average score of the menu item's likes.
        favorite_count (int): The number of times the menu item was favorited.
        saved_for_later_count (int): The number of times the menu item was saved for later.
        would_eat_again_yes (int): The number of times the menu item was would eat again yes.
        would_eat_again_no (int): The number of times the menu item was would eat again no.
        would_eat_again_maybe (int): The number of times the menu item was would eat again maybe.
        average_would_eat_again_score (float): The average score of the menu item's would eat again.

        updated_at (datetime): The date and time the metrics were last updated.
        created_at (datetime): The date and time the metrics were created.

    """

    menu_item = models.OneToOneField(
        MenuItem,
        on_delete=models.CASCADE,
        related_name="metrics",
    )

    like_count = models.PositiveIntegerField(default=0)
    dislike_count = models.PositiveIntegerField(default=0)
    average_like_score = models.DecimalField(max_digits=5, decimal_places=2, null=True, blank=True)
    favorite_count = models.PositiveIntegerField(default=0)
    saved_for_later_count = models.PositiveIntegerField(default=0)

    would_eat_again_yes = models.PositiveIntegerField(default=0)
    would_eat_again_no = models.PositiveIntegerField(default=0)
    would_eat_again_maybe = models.PositiveIntegerField(default=0)
    average_would_eat_again_score = models.DecimalField(max_digits=5, decimal_places=2, null=True, blank=True)

    updated_at = models.DateTimeField(auto_now=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        """Meta class for the MenuItemMetrics model."""

        db_table = "menu_item_metrics"
        unique_together = ["menu_item"]

    def __str__(self):
        """Return the string representation of the MenuItemMetrics instance."""
        return f"Metrics for menu item {self.menu_item.id}"


class MenuItemSimilarity(models.Model):
    """Represents the similarity between two menu items.

    Attributes:
        menu_item_a (MenuItem): The first menu item.
        menu_item_b (MenuItem): The second menu item.
        score (float): The similarity score between the two menu items.

    """

    menu_item_a = models.ForeignKey(MenuItem, on_delete=models.CASCADE, related_name="+")
    menu_item_b = models.ForeignKey(MenuItem, on_delete=models.CASCADE, related_name="+")
    score = models.FloatField()

    class Meta:
        """Meta class for the MenuItemSimilarity model."""

        unique_together = ("menu_item_a", "menu_item_b")
        indexes = [
            models.Index(fields=["menu_item_a", "menu_item_b"]),
        ]

    def __str__(self):
        """Return the string representation of the MenuItemSimilarity instance."""
        return f"Similarity between {self.menu_item_a.name} and {self.menu_item_b.name} is {self.score}"

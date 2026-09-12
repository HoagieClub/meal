"""User engagement with menu items: per-user interactions, aggregate metrics and item similarity."""

from django.db import models

from hoagiemeal.models.menu_item import MenuItem
from hoagiemeal.models.user import CustomUser


class MenuItemInteraction(models.Model):
    """One user's like, favourite and other flags for one menu item."""

    class WouldEatAgain(models.TextChoices):
        YES = "Y", "Yes"
        NO = "N", "No"
        MAYBE = "M", "Maybe"

    user = models.ForeignKey(CustomUser, on_delete=models.CASCADE, related_name="menu_item_interactions")
    menu_item = models.ForeignKey(MenuItem, on_delete=models.CASCADE, related_name="user_interactions")
    liked = models.BooleanField(null=True, blank=True)
    favorited = models.BooleanField(default=False)
    saved_for_later = models.BooleanField(default=False)
    would_eat_again = models.CharField(max_length=1, choices=WouldEatAgain.choices, null=True, blank=True)
    updated_at = models.DateTimeField(auto_now=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        constraints = [models.UniqueConstraint(fields=["user", "menu_item"], name="user_menu_item_interaction")]
        indexes = [
            models.Index(fields=["user"]),
            models.Index(fields=["menu_item"]),
        ]

    def __str__(self):
        return f"User {self.user.id} interacted with menu item {self.menu_item.id}"


class MenuItemMetrics(models.Model):
    """Interaction counts for a menu item, recomputed whenever an interaction changes."""

    menu_item = models.OneToOneField(MenuItem, on_delete=models.CASCADE, related_name="metrics")
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
        db_table = "menu_item_metrics"
        unique_together = ["menu_item"]

    def __str__(self):
        return f"Metrics for menu item {self.menu_item.id}"


class MenuItemSimilarity(models.Model):
    """Item-item similarity score, reserved for recommendations. Nothing writes it yet."""

    menu_item_a = models.ForeignKey(MenuItem, on_delete=models.CASCADE, related_name="+")
    menu_item_b = models.ForeignKey(MenuItem, on_delete=models.CASCADE, related_name="+")
    score = models.FloatField()

    class Meta:
        unique_together = ("menu_item_a", "menu_item_b")
        indexes = [models.Index(fields=["menu_item_a", "menu_item_b"])]

    def __str__(self):
        return f"Similarity between {self.menu_item_a.name} and {self.menu_item_b.name} is {self.score}"

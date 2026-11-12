"""The Hoagie Meal user model."""

from django.contrib.auth.models import AbstractUser
from django.core.validators import MaxValueValidator, MinValueValidator
from django.db import models


class CustomUser(AbstractUser):
    """Django's user extended with the Auth0 subject and Princeton-specific fields."""

    auth0_id = models.CharField(
        max_length=255, unique=True, null=True, blank=True, db_index=True, help_text="Auth0 ID"
    )
    net_id = models.CharField(
        max_length=20, unique=True, null=True, blank=True, db_index=True, help_text="University NetID"
    )
    class_year = models.PositiveSmallIntegerField(
        null=True, blank=True, validators=[MinValueValidator(1900), MaxValueValidator(2100)]
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "users"
        verbose_name = "user"
        verbose_name_plural = "users"

    def __str__(self):
        return f"{self.get_full_name()} ({self.net_id})"


class UserActivityDay(models.Model):
    """A campus day on which a user used the app while logged in.

    The basis for daily, weekly and monthly active user counts. last_login only keeps the latest
    visit, so this keeps the history.
    """

    user = models.ForeignKey(CustomUser, on_delete=models.CASCADE, related_name="activity_days")
    date = models.DateField()

    class Meta:
        db_table = "user_activity_days"
        constraints = [models.UniqueConstraint(fields=["user", "date"], name="user_activity_day")]
        indexes = [models.Index(fields=["date"])]

    def __str__(self):
        return f"User {self.user_id} active on {self.date}"

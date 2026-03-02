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


class CustomUser(AbstractUser):
    """Extend user model for the Hoagie Meal application.

    Inherits from Django's AbstractUser to include additional
    attributes relevant to the Hoagie Meal application.

    Attributes:
        net_id (str): University NetID; unique identifier for campus users.
        auth0_id (str): Auth0 ID; unique identifier for users authenticated through Auth0.
        class_year (int): Expected graduation year, validated between 1900 and 2100.
        created_at (datetime): Timestamp when the record was created.
        updated_at (datetime): Timestamp when the record was last updated.

    """

    auth0_id = models.CharField(
        max_length=255, unique=True, null=True, blank=True, db_index=True, help_text=_("Auth0 ID")
    )
    net_id = models.CharField(
        max_length=20, unique=True, null=True, blank=True, db_index=True, help_text=_("University NetID")
    )
    class_year = models.PositiveSmallIntegerField(
        null=True, blank=True, validators=[MinValueValidator(1900), MaxValueValidator(2100)]
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

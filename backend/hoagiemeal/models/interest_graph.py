"""Django models related to the user-based interest graph.

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


# class InterestNode(models.Model):
#     """Represents a node in the interest graph.

#     This could be a food category, cuisine type, flavor profile, or other concept
#     that connects users and menu items in the interest graph.

#     Attributes:
#         name (str): Name of the interest node.
#         description (str): Description of what this interest represents.
#         node_type (str): Type of interest node (category, flavor, etc.).
#         vector (VectorField): Vector embedding representing this interest in the embedding space.
#         popularity (float): Measure of how popular this interest is.
#         related_tags (list): Related tags or keywords.

#     """

#     class NodeType(models.TextChoices):
#         """Node type choices for the InterestNode model."""

#         CATEGORY = "CA", _("Food Category")
#         CUISINE = "CU", _("Cuisine Type")
#         FLAVOR = "FL", _("Flavor Profile")
#         INGREDIENT = "IN", _("Key Ingredient")
#         DIETARY = "DI", _("Dietary Preference")
#         CONCEPT = "CO", _("Abstract Concept")

#     name = models.CharField(max_length=100, unique=True)
#     description = models.TextField(blank=True)
#     node_type = models.CharField(
#         max_length=2,
#         choices=NodeType.choices,
#         default=NodeType.CATEGORY,
#     )
#     vector = VectorField(
#         dimensions=384,  # Matching other vector dimensions
#         null=True,
#         blank=True,
#         help_text=_("Vector embedding representing this interest in the embedding space"),
#     )
#     popularity = models.FloatField(
#         default=0.0,
#         help_text=_("Measure of how popular this interest is"),
#     )
#     related_tags = models.JSONField(
#         default=list,
#         blank=True,
#         help_text=_("Related tags or keywords"),
#     )

#     class Meta:
#         """Meta class for the InterestNode model."""

#         db_table = "interest_nodes"
#         indexes = [
#             models.Index(fields=["vector"], name="interest_node_vector_idx", opclasses=["vector_ops"]),
#             models.Index(fields=["node_type"]),
#             models.Index(fields=["popularity"]),
#         ]

#     def __str__(self):
#         """Return the string representation of the InterestNode instance.

#         Returns:
#             str: A description of the interest node.

#         """
#         return f"{self.name} ({self.get_node_type_display()})"


# class MenuItemInterest(models.Model):
#     """Represents a connection between a menu item and an interest node.

#     Attributes:
#         menu_item (MenuItem): The menu item.
#         interest (InterestNode): The interest node.
#         strength (float): Strength of the connection (0.0-1.0).
#         is_primary (bool): Whether this is a primary interest for the item.
#         created_at (datetime): When this connection was created.

#     """

#     menu_item = models.ForeignKey(MenuItem, on_delete=models.CASCADE, related_name="interests")
#     interest = models.ForeignKey(InterestNode, on_delete=models.CASCADE, related_name="menu_items")
#     strength = models.FloatField(
#         default=0.5,
#         validators=[MinValueValidator(0.0), MaxValueValidator(1.0)],
#         help_text=_("Strength of the connection (0.0-1.0)"),
#     )
#     is_primary = models.BooleanField(
#         default=False,
#         help_text=_("Whether this is a primary interest for the item"),
#     )
#     created_at = models.DateTimeField(auto_now_add=True)

#     class Meta:
#         """Meta class for the MenuItemInterest model."""

#         db_table = "menu_item_interests"
#         unique_together = ("menu_item", "interest")
#         indexes = [
#             models.Index(fields=["strength"]),
#             models.Index(fields=["is_primary"]),
#         ]

#     def __str__(self):
#         """Return the string representation of the MenuItemInterest instance.

#         Returns:
#             str: A description of the connection.

#         """
#         return f"{self.menu_item.name} - {self.interest.name} ({self.strength:.2f})"


# class UserInterest(models.Model):
#     """Represents a connection between a user and an interest node.

#     Attributes:
#         user (CustomUser): The user.
#         interest (InterestNode): The interest node.
#         explicit_rating (float): User's explicit rating of this interest (0.0-5.0).
#         implicit_score (float): System-derived score based on behavior (0.0-1.0).
#         last_interaction (datetime): When the user last interacted with this interest.

#     """

#     user = models.ForeignKey(CustomUser, on_delete=models.CASCADE, related_name="interests")
#     interest = models.ForeignKey(InterestNode, on_delete=models.CASCADE, related_name="users")
#     explicit_rating = models.FloatField(
#         null=True,
#         blank=True,
#         validators=[MinValueValidator(0.0), MaxValueValidator(5.0)],
#         help_text=_("User's explicit rating of this interest (0.0-5.0)"),
#     )
#     implicit_score = models.FloatField(
#         default=0.5,
#         validators=[MinValueValidator(0.0), MaxValueValidator(1.0)],
#         help_text=_("System-derived score based on behavior (0.0-1.0)"),
#     )
#     last_interaction = models.DateTimeField(auto_now=True)

#     class Meta:
#         """Meta class for the UserInterest model."""

#         db_table = "user_interests"
#         unique_together = ("user", "interest")
#         indexes = [
#             models.Index(fields=["explicit_rating"]),
#             models.Index(fields=["implicit_score"]),
#             models.Index(fields=["last_interaction"]),
#         ]

#     def __str__(self):
#         """Return the string representation of the UserInterest instance.

#         Returns:
#             str: A description of the connection.

#         """
#         rating = f"{self.explicit_rating:.1f}" if self.explicit_rating is not None else "No rating"
#         return f"{self.user.get_full_name()} - {self.interest.name} ({rating})"


# class SocialRecommendation(models.Model):
#     """Tracks recommendations based on social connections.

#     Attributes:
#         target_user (CustomUser): User receiving the recommendation.
#         source_user (CustomUser): User whose preference influenced the recommendation.
#         menu_item (MenuItem): The recommended menu item.
#         similarity_score (float): Similarity between the users (0.0-1.0).
#         timestamp (datetime): When the recommendation was made.
#         was_successful (bool): Whether the recommendation was successful.

#     """

#     target_user = models.ForeignKey(
#         CustomUser, on_delete=models.CASCADE, related_name="received_social_recommendations"
#     )
#     source_user = models.ForeignKey(CustomUser, on_delete=models.CASCADE, related_name="influenced_recommendations")
#     menu_item = models.ForeignKey(MenuItem, on_delete=models.CASCADE, related_name="social_recommendation_instances")
#     similarity_score = models.FloatField(
#         validators=[MinValueValidator(0.0), MaxValueValidator(1.0)],
#         help_text=_("Similarity between the users (0.0-1.0)"),
#     )
#     timestamp = models.DateTimeField(auto_now_add=True)
#     was_successful = models.BooleanField(null=True, blank=True)

#     class Meta:
#         """Meta class for the SocialRecommendation model."""

#         db_table = "social_recommendations"
#         indexes = [
#             models.Index(fields=["target_user", "timestamp"]),
#             models.Index(fields=["similarity_score"]),
#             models.Index(fields=["was_successful"]),
#         ]

#     def __str__(self):
#         """Return the string representation of the SocialRecommendation instance.

#         Returns:
#             str: A description of the social recommendation.

#         """
#         return (
#             f"Recommendation of {self.menu_item.name} to {self.target_user.get_full_name()} "
#             f"based on {self.source_user.get_full_name()}"
#         )

"""Django models related to the Hoagie Meal recommendation algorithm.

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

from hoagiemeal.models.menu import MenuItem
from hoagiemeal.models.user import CustomUser


# class FoodVector(models.Model):
#     """Stores vector representations of menu items for recommendation.

#     Attributes:
#         menu_item (MenuItem): The menu item this vector represents.
#         vector (VectorField): Vector embedding representing the menu item.
#         surprise_factor (float): How unusual or novel the menu item is (0.0-1.0).
#         embedding_version (str): Version of the embedding model used.
#         embedding_metadata (dict): Additional metadata about the embedding.
#         last_updated (datetime): When the vector was last updated.
#         popularity_score (float): Score representing item popularity (0.0-1.0).
#         seasonality (dict): Information about seasonal relevance.
#         flavor_profile (dict): Quantified flavor characteristics.
#         visual_appeal (float): Score for visual appeal (0.0-1.0).

#     """

#     menu_item = models.OneToOneField(MenuItem, on_delete=models.CASCADE, related_name="food_vector")
#     vector = VectorField(
#         dimensions=384,  # Using BERT-like embedding size
#         help_text=_("Vector embedding of menu item characteristics"),
#     )
#     surprise_factor = models.FloatField(
#         default=0.0,
#         validators=[MinValueValidator(0.0), MaxValueValidator(1.0)],
#         help_text=_("How unusual or novel the menu item is (0.0-1.0)"),
#         db_index=True,
#     )
#     embedding_version = models.CharField(
#         max_length=50,
#         default="v1.0",
#         help_text=_("Version of the embedding model used"),
#     )
#     embedding_metadata = models.JSONField(
#         default=dict,
#         blank=True,
#         help_text=_("Additional metadata about the embedding"),
#     )
#     last_updated = models.DateTimeField(auto_now=True, db_index=True)
#     popularity_score = models.FloatField(
#         default=0.5,
#         validators=[MinValueValidator(0.0), MaxValueValidator(1.0)],
#         help_text=_("Score representing item popularity (0.0-1.0)"),
#         db_index=True,
#     )
#     seasonality = models.JSONField(
#         default=dict,
#         blank=True,
#         help_text=_("Information about seasonal relevance"),
#     )
#     flavor_profile = models.JSONField(
#         default=dict,
#         blank=True,
#         help_text=_("Quantified flavor characteristics"),
#     )
#     visual_appeal = models.FloatField(
#         default=0.5,
#         validators=[MinValueValidator(0.0), MaxValueValidator(1.0)],
#         help_text=_("Score for visual appeal (0.0-1.0)"),
#     )

#     class Meta:
#         """Meta class for the FoodVector model."""

#         db_table = "food_vectors"
#         indexes = [
#             models.Index(fields=["vector"], name="food_vector_idx", opclasses=["vector_ops"]),
#             models.Index(fields=["surprise_factor"]),
#             models.Index(fields=["last_updated"]),
#             models.Index(fields=["popularity_score"]),
#             models.Index(fields=["visual_appeal"]),
#         ]

#     def __str__(self):
#         """Return the string representation of the FoodVector instance.

#         Returns:
#             str: A description of the food vector.

#         """
#         return f"Food vector for {self.menu_item.name}"


# class UserVector(models.Model):
#     """Stores vector representations of user preferences for recommendation.

#     Attributes:
#         user (CustomUser): The user this vector represents.
#         vector (VectorField): Vector embedding representing user preferences.
#         novelty_preference (float): User's preference for novel recommendations (0.0-1.0).
#         embedding_version (str): Version of the embedding model used.
#         embedding_metadata (dict): Additional metadata about the embedding.
#         last_updated (datetime): When the vector was last updated.
#         confidence (float): Confidence in the accuracy of this vector (0.0-1.0).
#         temporal_context (dict): Contextual information about time-based preferences.
#         exploration_rate (float): Current exploration rate for this user (0.0-1.0).
#         preference_stability (float): Measure of how stable the user's preferences are (0.0-1.0).

#     """

#     user = models.OneToOneField(CustomUser, on_delete=models.CASCADE, related_name="preference_vector")
#     vector = VectorField(
#         dimensions=384,  # Matching food vector dimensions
#         help_text=_("Vector embedding of user preferences"),
#     )
#     novelty_preference = models.FloatField(
#         default=0.5,
#         validators=[MinValueValidator(0.0), MaxValueValidator(1.0)],
#         help_text=_("User's preference for novel recommendations (0.0-1.0)"),
#     )
#     embedding_version = models.CharField(
#         max_length=50,
#         default="v1.0",
#         help_text=_("Version of the embedding model used"),
#     )
#     embedding_metadata = models.JSONField(
#         default=dict,
#         blank=True,
#         help_text=_("Additional metadata about the embedding"),
#     )
#     last_updated = models.DateTimeField(auto_now=True, db_index=True)
#     confidence = models.FloatField(
#         default=0.7,
#         validators=[MinValueValidator(0.0), MaxValueValidator(1.0)],
#         help_text=_("Confidence in the accuracy of this vector (0.0-1.0)"),
#     )
#     temporal_context = models.JSONField(
#         default=dict,
#         blank=True,
#         help_text=_("Contextual information about time-based preferences"),
#     )
#     exploration_rate = models.FloatField(
#         default=0.2,
#         validators=[MinValueValidator(0.0), MaxValueValidator(1.0)],
#         help_text=_("Current exploration rate for this user (0.0-1.0)"),
#     )
#     preference_stability = models.FloatField(
#         default=0.5,
#         validators=[MinValueValidator(0.0), MaxValueValidator(1.0)],
#         help_text=_("Measure of how stable the user's preferences are (0.0-1.0)"),
#     )

#     class Meta:
#         """Meta class for the UserVector model."""

#         db_table = "user_vectors"
#         indexes = [
#             models.Index(fields=["vector"], name="user_vector_idx", opclasses=["vector_ops"]),
#             models.Index(fields=["novelty_preference"]),
#             models.Index(fields=["last_updated"]),
#             models.Index(fields=["confidence"]),
#             models.Index(fields=["exploration_rate"]),
#             models.Index(fields=["preference_stability"]),
#         ]

#     def __str__(self):
#         """Return the string representation of the UserVector instance.

#         Returns:
#             str: A description of the user vector.

#         """
#         return f"Preference vector for {self.user.get_full_name()}"


# class RecommendationAction(models.Model):
#     """Track recommendations made to users by the bandit algorithm.

#     Attributes:
#         user (CustomUser): User who received the recommendation.
#         menu_item (MenuItem): The recommended menu item.
#         context_features (dict): Features of the context when recommendation was made.
#         confidence_score (float): Confidence score from the bandit algorithm.
#         exploration_factor (float): How much exploration influenced this recommendation.
#         timestamp (datetime): When the recommendation was made.
#         session_id (str): Unique identifier for the recommendation session.

#     """

#     user = models.ForeignKey(CustomUser, on_delete=models.CASCADE, related_name="received_recommendations")
#     menu_item = models.ForeignKey(MenuItem, on_delete=models.CASCADE, related_name="recommendation_instances")
#     context_features = models.JSONField(
#         help_text=_("Features of the context when recommendation was made"),
#     )
#     confidence_score = models.FloatField(
#         help_text=_("Confidence score from the bandit algorithm"),
#     )
#     exploration_factor = models.FloatField(
#         help_text=_("How much exploration influenced this recommendation (0.0-1.0)"),
#         validators=[MinValueValidator(0.0), MaxValueValidator(1.0)],
#     )
#     timestamp = models.DateTimeField(auto_now_add=True, db_index=True)
#     session_id = models.CharField(max_length=64, db_index=True)

#     class Meta:
#         """Meta class for the RecommendationAction model."""

#         db_table = "recommendation_actions"
#         indexes = [
#             models.Index(fields=["user", "timestamp"]),
#             models.Index(fields=["menu_item", "timestamp"]),
#         ]

#     def __str__(self):
#         """Return the string representation of the RecommendationAction instance.

#         Returns:
#             str: A description of the recommendation action.

#         """
#         return f"Recommendation of {self.menu_item.name} to {self.user.get_full_name()}"


# class RecommendationFeedback(models.Model):
#     """Store user feedback on recommendations for bandit learning.

#     Attributes:
#         recommendation (RecommendationAction): The recommendation this feedback is for.
#         rating (float): User's rating of the recommendation.
#         consumed (bool): Whether the user actually consumed the item.
#         feedback_type (str): Type of feedback (explicit rating, implicit, etc.).
#         timestamp (datetime): When the feedback was provided.
#         additional_comments (str): Any additional user comments.

#     """

#     class FeedbackType(models.TextChoices):
#         """Feedback type choices for the RecommendationFeedback model."""

#         EXPLICIT_RATING = "ER", _("Explicit Rating")
#         IMPLICIT_CONSUMPTION = "IC", _("Implicit Consumption")
#         SKIP = "SK", _("Skipped")
#         SAVE_FOR_LATER = "SL", _("Saved for Later")

#     recommendation = models.OneToOneField(RecommendationAction, on_delete=models.CASCADE, related_name="feedback")
#     rating = models.FloatField(
#         null=True,
#         blank=True,
#         validators=[MinValueValidator(0.0), MaxValueValidator(5.0)],
#         help_text=_("User's rating of the recommendation (0.0-5.0)"),
#     )
#     consumed = models.BooleanField(
#         default=False,
#         help_text=_("Whether the user actually consumed the item"),
#     )
#     feedback_type = models.CharField(
#         max_length=2,
#         choices=FeedbackType.choices,
#         default=FeedbackType.EXPLICIT_RATING,
#     )
#     timestamp = models.DateTimeField(auto_now_add=True, db_index=True)
#     additional_comments = models.TextField(blank=True)

#     class Meta:
#         """Meta class for the RecommendationFeedback model."""

#         db_table = "recommendation_feedback"
#         indexes = [
#             models.Index(fields=["rating"]),
#             models.Index(fields=["feedback_type"]),
#             models.Index(fields=["timestamp"]),
#         ]

#     def __str__(self):
#         """Return the string representation of the RecommendationFeedback instance.

#         Returns:
#             str: A description of the feedback.

#         """
#         return f"Feedback on {self.recommendation.menu_item.name}: {self.rating or 'No rating'}"

# TODO: Not sure if needed
from django.db import models
from django.core.validators import MinValueValidator, MaxValueValidator
from django.utils.translation import gettext_lazy as _
from pgvector.django import VectorField

# class BanditModel(models.Model):
#     """Store bandit model parameters for recommendation algorithm.

#     Attributes:
#         name (str): Name of the bandit model.
#         algorithm_type (str): Type of bandit algorithm.
#         parameters (dict): Current parameters of the bandit model.
#         creation_date (datetime): When the model was created.
#         last_updated (datetime): When the model was last updated.
#         is_active (bool): Whether this model is currently active.
#         performance_metrics (dict): Metrics on model performance.

#     """

#     class AlgorithmType(models.TextChoices):
#         """Algorithm type choices for the BanditModel."""

#         LINUCB = "LU", _("Linear UCB")
#         THOMPSON = "TS", _("Thompson Sampling")
#         EXP3 = "E3", _("EXP3")
#         CUSTOM = "CU", _("Custom")

#     name = models.CharField(max_length=100, unique=True)
#     algorithm_type = models.CharField(
#         max_length=2,
#         choices=AlgorithmType.choices,
#         default=AlgorithmType.LINUCB,
#     )
#     parameters = models.JSONField(
#         help_text=_("Current parameters of the bandit model"),
#     )
#     creation_date = models.DateTimeField(auto_now_add=True)
#     last_updated = models.DateTimeField(auto_now=True)
#     is_active = models.BooleanField(default=True)
#     performance_metrics = models.JSONField(
#         default=dict,
#         blank=True,
#         help_text=_("Metrics on model performance"),
#     )

#     class Meta:
#         """Meta class for the BanditModel."""

#         db_table = "bandit_models"
#         indexes = [
#             models.Index(fields=["algorithm_type"]),
#             models.Index(fields=["is_active"]),
#         ]

#     def __str__(self):
#         """Return the string representation of the BanditModel instance.

#         Returns:
#             str: A description of the bandit model.

#         """
#         return f"{self.name} ({self.get_algorithm_type_display()})"


# class RecommendationExplanation(models.Model):
#     """Stores explanations for recommendations to improve interpretability.

#     Attributes:
#         recommendation (RecommendationAction): The recommendation being explained.
#         primary_reason (str): Primary reason for the recommendation.
#         explanation_text (str): Human-readable explanation.
#         contributing_factors (dict): Factors that contributed to this recommendation.
#         confidence (float): Confidence in this explanation (0.0-1.0).
#         user_feedback (str): User feedback on the explanation.

#     """

#     class PrimaryReason(models.TextChoices):
#         """Primary reason choices for the RecommendationExplanation model."""

#         SIMILAR_LIKED = "SL", _("Similar to Items You Liked")
#         POPULAR_ITEM = "PI", _("Popular Item")
#         INTEREST_MATCH = "IM", _("Matches Your Interests")
#         SOCIAL_INFLUENCE = "SI", _("Friends Enjoyed This")
#         NUTRITIONAL_MATCH = "NM", _("Matches Nutritional Preferences")
#         NOVELTY = "NO", _("Something New to Try")
#         SEASONAL = "SE", _("Seasonal Recommendation")

#     recommendation = models.OneToOneField(RecommendationAction, on_delete=models.CASCADE, related_name="explanation")
#     primary_reason = models.CharField(
#         max_length=2,
#         choices=PrimaryReason.choices,
#         default=PrimaryReason.INTEREST_MATCH,
#     )
#     explanation_text = models.TextField(
#         help_text=_("Human-readable explanation"),
#     )
#     contributing_factors = models.JSONField(
#         default=dict,
#         help_text=_("Factors that contributed to this recommendation"),
#     )
#     confidence = models.FloatField(
#         default=0.8,
#         validators=[MinValueValidator(0.0), MaxValueValidator(1.0)],
#         help_text=_("Confidence in this explanation (0.0-1.0)"),
#     )
#     user_feedback = models.TextField(
#         blank=True,
#         help_text=_("User feedback on the explanation"),
#     )

#     class Meta:
#         """Meta class for the RecommendationExplanation model."""

#         db_table = "recommendation_explanations"
#         indexes = [
#             models.Index(fields=["primary_reason"]),
#             models.Index(fields=["confidence"]),
#         ]

#     def __str__(self):
#         """Return the string representation of the RecommendationExplanation instance.

#         Returns:
#             str: A description of the explanation.

#         """
#         return f"Explanation for recommendation of {self.recommendation.menu_item.name}"

# class ExplanationTemplate(models.Model):
#     """Templates for generating human-readable explanations.

#     Attributes:
#         name (str): Name of the template.
#         template_text (str): Template text with placeholders.
#         reason_type (str): Type of reason this template is for.
#         is_active (bool): Whether this template is currently active.
#         created_at (datetime): When this template was created.
#         last_used (datetime): When this template was last used.
#         usage_count (int): How many times this template has been used.

#     """

#     name = models.CharField(max_length=100, unique=True)
#     template_text = models.TextField(
#         help_text=_("Template text with placeholders"),
#     )
#     reason_type = models.CharField(
#         max_length=2,
#         choices=RecommendationExplanation.PrimaryReason.choices,
#     )
#     is_active = models.BooleanField(default=True)
#     created_at = models.DateTimeField(auto_now_add=True)
#     last_used = models.DateTimeField(null=True, blank=True)
#     usage_count = models.PositiveIntegerField(default=0)

#     class Meta:
#         """Meta class for the ExplanationTemplate model."""

#         db_table = "explanation_templates"
#         indexes = [
#             models.Index(fields=["reason_type"]),
#             models.Index(fields=["is_active"]),
#             models.Index(fields=["usage_count"]),
#         ]

#     def __str__(self):
#         """Return the string representation of the ExplanationTemplate instance.

#         Returns:
#             str: A description of the template.

#         """
#         return f"{self.name} ({self.get_reason_type_display()})"

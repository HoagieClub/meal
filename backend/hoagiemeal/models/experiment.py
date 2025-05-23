"""Django models related to A/B testing and experimentation.

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


class RecommendationExperiment(models.Model):
    """Tracks A/B tests and experiments for the recommendation system.

    Attributes:
        name (str): Name of the experiment.
        description (str): Description of what the experiment is testing.
        start_date (datetime): When the experiment started.
        end_date (datetime): When the experiment ended.
        is_active (bool): Whether the experiment is currently active.
        experiment_type (str): Type of experiment.
        variants (dict): Different variants being tested.
        metrics (dict): Metrics being tracked for this experiment.
        target_users (list): Target user segments for this experiment.
        created_by (CustomUser): User who created this experiment.

    """

    class ExperimentType(models.TextChoices):
        """Experiment type choices for the RecommendationExperiment model."""

        AB_TEST = "AB", _("A/B Test")
        MULTIVARIATE = "MV", _("Multivariate Test")
        BANDIT = "BA", _("Bandit Algorithm Test")
        FEATURE_ROLLOUT = "FR", _("Feature Rollout")
        ALGORITHM_COMPARISON = "AC", _("Algorithm Comparison")

    name = models.CharField(max_length=100, unique=True)
    description = models.TextField(
        help_text=_("Description of what the experiment is testing"),
    )
    start_date = models.DateTimeField(db_index=True)
    end_date = models.DateTimeField(null=True, blank=True, db_index=True)
    is_active = models.BooleanField(default=True, db_index=True)
    experiment_type = models.CharField(
        max_length=2,
        choices=ExperimentType.choices,
        default=ExperimentType.AB_TEST,
    )
    variants = models.JSONField(
        help_text=_("Different variants being tested"),
    )
    metrics = models.JSONField(
        help_text=_("Metrics being tracked for this experiment"),
    )
    target_users = models.JSONField(
        default=list,
        blank=True,
        help_text=_("Target user segments for this experiment"),
    )
    created_by = models.ForeignKey(
        CustomUser,
        on_delete=models.SET_NULL,
        null=True,
        related_name="created_experiments",
    )

    class Meta:
        """Meta class for the RecommendationExperiment model."""

        db_table = "recommendation_experiments"
        indexes = [
            models.Index(fields=["experiment_type"]),
            models.Index(fields=["is_active", "start_date"]),
        ]

    def __str__(self):
        """Return the string representation of the RecommendationExperiment instance.

        Returns:
            str: A description of the experiment.

        """
        status = "Active" if self.is_active else "Inactive"
        return f"{self.name} ({status})"


class ExperimentAssignment(models.Model):
    """Tracks which users are assigned to which experiment variants.

    Attributes:
        experiment (RecommendationExperiment): The experiment.
        user (CustomUser): The user assigned to a variant.
        variant (str): The variant the user is assigned to.
        assignment_date (datetime): When the user was assigned to this variant.
        is_control_group (bool): Whether the user is in the control group.

    """

    experiment = models.ForeignKey(
        RecommendationExperiment,
        on_delete=models.CASCADE,
        related_name="user_assignments",
    )
    user = models.ForeignKey(
        CustomUser,
        on_delete=models.CASCADE,
        related_name="experiment_assignments",
    )
    variant = models.CharField(
        max_length=50,
        help_text=_("The variant the user is assigned to"),
    )
    assignment_date = models.DateTimeField(auto_now_add=True, db_index=True)
    is_control_group = models.BooleanField(
        default=False,
        help_text=_("Whether the user is in the control group"),
    )

    class Meta:
        """Meta class for the ExperimentAssignment model."""

        db_table = "experiment_assignments"
        unique_together = ("experiment", "user")
        indexes = [
            models.Index(fields=["variant"]),
            models.Index(fields=["is_control_group"]),
        ]

    def __str__(self):
        """Return the string representation of the ExperimentAssignment instance.

        Returns:
            str: A description of the assignment.

        """
        return f"{self.user.get_full_name()} assigned to {self.variant} in {self.experiment.name}"


class ExperimentMetricLog(models.Model):
    """Logs metric data for experiment analysis.

    Attributes:
        experiment (RecommendationExperiment): The experiment.
        user (CustomUser): The user who generated this metric.
        variant (str): The variant the user was assigned to.
        metric_name (str): Name of the metric being logged.
        metric_value (float): Value of the metric.
        timestamp (datetime): When this metric was recorded.
        context (dict): Additional contextual information.

    """

    experiment = models.ForeignKey(
        RecommendationExperiment,
        on_delete=models.CASCADE,
        related_name="metric_logs",
    )
    user = models.ForeignKey(
        CustomUser,
        on_delete=models.CASCADE,
        related_name="experiment_metrics",
    )
    variant = models.CharField(
        max_length=50,
        help_text=_("The variant the user was assigned to"),
    )
    metric_name = models.CharField(
        max_length=100,
        help_text=_("Name of the metric being logged"),
        db_index=True,
    )
    metric_value = models.FloatField(
        help_text=_("Value of the metric"),
    )
    timestamp = models.DateTimeField(auto_now_add=True, db_index=True)
    context = models.JSONField(
        default=dict,
        blank=True,
        help_text=_("Additional contextual information"),
    )

    class Meta:
        """Meta class for the ExperimentMetricLog model."""

        db_table = "experiment_metric_logs"
        indexes = [
            models.Index(fields=["experiment", "metric_name"]),
            models.Index(fields=["user", "metric_name"]),
            models.Index(fields=["variant", "metric_name"]),
        ]

    def __str__(self):
        """Return the string representation of the ExperimentMetricLog instance.

        Returns:
            str: A description of the metric log.

        """
        return f"{self.metric_name}: {self.metric_value} for {self.user.get_full_name()} in {self.experiment.name}"

"""Django models for the HoagieMeal project.

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

from .user import CustomUser, UserDietaryProfile
from .dining import DiningVenue
from .menu import Menu, MenuItem, MenuItemNutrient, MenuItemMetrics
from .nutrition import UserMealLog, NutritionGoalType, UserGoal, DailyGoalProgress
from .recommendation import (
    FoodVector, UserVector, 
    RecommendationAction, RecommendationFeedback, 
    BanditModel, RecommendationExplanation, 
    ExplanationTemplate,
)
from .engagement import UserStreak, UserPreferenceSnapshot, PreferenceChangeEvent
from .meal_plan import MealPlanType, UserMealPlan, SwipeTransactionIndividual
from .marketplace import SwipeListingStatus, SwipeListing, SwipeOffer, SwipeTransactionMarketplace
from .achievement import AchievementCategory, Achievement, UserAchievement, Badge, UserBadge
from .interest_graph import InterestNode, MenuItemInterest, UserInterest, SocialRecommendation
from .experiment import RecommendationExperiment, ExperimentAssignment, ExperimentMetricLog

__all__ = [
    "CustomUser", "UserDietaryProfile",
    "DiningVenue",
    "Menu", "MenuItem", "MenuItemNutrient", "MenuItemMetrics",
    "UserMealLog", "NutritionGoalType", "UserGoal", "DailyGoalProgress",
    "FoodVector", "UserVector",
    "RecommendationAction", "RecommendationFeedback", "BanditModel", "RecommendationExplanation", "ExplanationTemplate",
    "UserStreak", "UserPreferenceSnapshot", "PreferenceChangeEvent",
    "MealPlanType", "UserMealPlan", "SwipeTransactionIndividual",
    "SwipeListingStatus", "SwipeListing", "SwipeOffer", "SwipeTransactionMarketplace",
    "AchievementCategory", "Achievement", "UserAchievement", "Badge", "UserBadge",
    "InterestNode", "MenuItemInterest", "UserInterest", "SocialRecommendation",
    "RecommendationExperiment", "ExperimentAssignment", "ExperimentMetricLog",
]

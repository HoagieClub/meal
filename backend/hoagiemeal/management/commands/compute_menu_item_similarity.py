"""Django management command to compute menu item similarity scores.

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

from django.core.management.base import BaseCommand
from collections import defaultdict
from itertools import combinations
from django.db import transaction

from hoagiemeal.models.engagement import MenuItemInteraction, MenuItemSimilarity


TOP_K = 30  # The number of similar menu items to return for each menu item.


def get_user_likes():
    """Return mapping: user_id -> set(menu_item_id)."""
    user_likes = defaultdict(set)
    qs = MenuItemInteraction.objects.filter(liked=True).values_list("user_id", "menu_item_id")

    # Add user likes to mapping
    for user_id, menu_item_id in qs:
        user_likes[user_id].add(menu_item_id)

    return user_likes


def compute_co_occurrence(user_likes):
    """Return mapping: (item_a, item_b) -> co-like count."""
    co_occurrence = defaultdict(int)

    for items in user_likes.values():
        # Skip if cannot compute co-occurrence (not enough items)
        if len(items) < 2:
            continue
        for a, b in combinations(items, 2):
            co_occurrence[(a, b)] += 1
            co_occurrence[(b, a)] += 1

    return co_occurrence


def compute_item_like_counts(user_likes):
    """Return mapping: item_id -> total likes."""
    like_counts = defaultdict(int)

    # Add item likes to mapping
    for items in user_likes.values():
        for item_id in items:
            like_counts[item_id] += 1

    return like_counts


def compute_similarity_scores(co_occurrence, like_counts):
    """Return list of (item_a, item_b, score)."""
    similarities = []

    for (a, b), co_count in co_occurrence.items():
        # Skip if cannot compute similarity (no likes)
        if co_count < 2:
            continue

        # Jaccard similarity
        denom = like_counts.get(a, 0) + like_counts.get(b, 0) - co_count
        if denom == 0:
            continue

        # Compute similarity score
        score = co_count / denom
        similarities.append((a, b, score))

    return similarities


def select_top_k(similarities, k=TOP_K):
    """Return mapping: item_a -> list of (item_b, score)."""
    top_k = defaultdict(list)

    for a, b, score in similarities:
        # Add similarity to mapping
        top_k[a].append((b, score))

    # Sort similarities by score and select top k
    for a in top_k:
        top_k[a].sort(key=lambda x: x[1], reverse=True)
        top_k[a] = top_k[a][:k]

    return top_k


def persist_similarities(top_k):
    """Replace all MenuItemSimilarity rows with new data."""
    with transaction.atomic():
        # Delete all MenuItemSimilarity rows
        MenuItemSimilarity.objects.all().delete()

        # Create new MenuItemSimilarity rows
        objs = [
            MenuItemSimilarity(
                menu_item_a_id=a,
                menu_item_b_id=b,
                score=score,
            )
            for a, neighbors in top_k.items()
            for b, score in neighbors
        ]

        MenuItemSimilarity.objects.bulk_create(objs, batch_size=1000)


def recompute_menu_item_similarity():
    """Full offline pipeline for item-item collaborative filtering."""
    user_likes = get_user_likes()
    co_occurrence = compute_co_occurrence(user_likes)
    like_counts = compute_item_like_counts(user_likes)
    similarities = compute_similarity_scores(co_occurrence, like_counts)
    top_k = select_top_k(similarities)
    persist_similarities(top_k)


class Command(BaseCommand):
    """Command to recompute menu item similarity scores."""

    help = "Recompute menu item similarity scores"

    def handle(self, *args, **options):
        """Handle the command to recompute menu item similarity scores."""
        self.stdout.write("Computing menu item similarities...")
        recompute_menu_item_similarity()
        self.stdout.write("Done.")

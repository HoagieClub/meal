"""Django management command to seed fake user interactions for testing recommendations.

Creates fake users with varied like/favorite patterns across existing menu items,
then runs similarity computation so the recommendation endpoint returns real scores.

Usage:
    python manage.py seed_interactions              # 10 fake users, 30% like rate
    python manage.py seed_interactions --users 20   # 20 fake users
    python manage.py seed_interactions --clear      # remove seeded data first
"""

import random
from django.core.management.base import BaseCommand
from django.db import transaction

from hoagiemeal.models.user import CustomUser
from hoagiemeal.models.menu_item import MenuItem
from hoagiemeal.models.engagement import MenuItemInteraction, MenuItemMetrics
from hoagiemeal.management.commands.compute_menu_item_similarity import recompute_menu_item_similarity

SEED_PREFIX = "seeduser"


class Command(BaseCommand):
    help = "Seed fake user interactions for testing the recommendation system"

    def add_arguments(self, parser):
        parser.add_argument("--users", type=int, default=10, help="Number of fake users to create (default: 10)")
        parser.add_argument("--like-rate", type=float, default=0.3, help="Probability a user likes a given item (default: 0.3)")
        parser.add_argument("--clear", action="store_true", help="Remove all seeded users and their interactions first")

    def handle(self, *args, **options):
        num_users = options["users"]
        like_rate = options["like_rate"]

        if options["clear"]:
            self._clear_seeded_data()

        items = list(MenuItem.objects.all())
        if not items:
            self.stderr.write("No menu items in the database. Run seed_menus first.")
            return

        self.stdout.write(f"Found {len(items)} menu items.")
        self.stdout.write(f"Creating {num_users} fake users with ~{like_rate*100:.0f}% like rate...")

        users = self._create_users(num_users)
        self._create_interactions(users, items, like_rate)
        self._update_metrics(items)

        self.stdout.write("Computing similarities...")
        recompute_menu_item_similarity()

        self.stdout.write(self.style.SUCCESS("Done. Recommendation endpoint should now return real scores."))

    def _clear_seeded_data(self):
        seed_users = CustomUser.objects.filter(username__startswith=SEED_PREFIX)
        count = seed_users.count()
        seed_users.delete()
        self.stdout.write(f"Cleared {count} seeded users and their interactions.")

    def _create_users(self, num_users):
        users = []
        with transaction.atomic():
            for i in range(num_users):
                username = f"{SEED_PREFIX}_{i}"
                user, _ = CustomUser.objects.get_or_create(
                    username=username,
                    defaults={"email": f"{username}@test.local", "first_name": f"Seed {i}"},
                )
                users.append(user)
        return users

    def _create_interactions(self, users, items, like_rate):
        interactions = []
        for user in users:
            for item in items:
                if random.random() < like_rate:
                    liked = True
                    favorited = random.random() < 0.2
                elif random.random() < 0.1:
                    liked = False
                    favorited = False
                else:
                    continue

                interactions.append(
                    MenuItemInteraction(
                        user=user,
                        menu_item=item,
                        liked=liked,
                        favorited=favorited,
                    )
                )

        with transaction.atomic():
            MenuItemInteraction.objects.filter(user__username__startswith=SEED_PREFIX).delete()
            MenuItemInteraction.objects.bulk_create(interactions, batch_size=1000, ignore_conflicts=True)

        self.stdout.write(f"Created {len(interactions)} interactions.")

    def _update_metrics(self, items):
        for item in items:
            interactions = MenuItemInteraction.objects.filter(menu_item=item)
            likes = interactions.filter(liked=True).count()
            dislikes = interactions.filter(liked=False).count()
            favorites = interactions.filter(favorited=True).count()

            total = likes + dislikes
            avg_score = (likes / total * 100) if total > 0 else None

            MenuItemMetrics.objects.update_or_create(
                menu_item=item,
                defaults={
                    "like_count": likes,
                    "dislike_count": dislikes,
                    "favorite_count": favorites,
                    "average_like_score": avg_score,
                },
            )

        self.stdout.write(f"Updated metrics for {len(items)} items.")

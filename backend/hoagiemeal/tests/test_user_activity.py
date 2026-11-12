"""Daily activity: one row per user per campus day they use the app logged in."""

import datetime
from unittest.mock import patch

from django.core.cache import cache
from django.test import TestCase

from hoagiemeal.api.services.user import get_or_create_user
from hoagiemeal.models import CustomUser, UserActivityDay

CLAIMS = {"sub": "auth0|tiger", "https://hoagie.io/email": "tiger@princeton.edu"}
LOCAL_TODAY = "hoagiemeal.api.services.user.local_today"
MONDAY = datetime.date(2026, 11, 16)
TUESDAY = datetime.date(2026, 11, 17)


class ActivityDayTests(TestCase):
    def setUp(self):
        cache.clear()

    def days(self):
        return list(UserActivityDay.objects.order_by("date", "id").values_list("user__auth0_id", "date"))

    def test_one_row_per_user_per_day_however_many_requests(self):
        with patch(LOCAL_TODAY, return_value=MONDAY):
            for _ in range(3):
                get_or_create_user(CLAIMS)
            get_or_create_user({"sub": "auth0|other"})
        with patch(LOCAL_TODAY, return_value=TUESDAY):
            get_or_create_user(CLAIMS)

        self.assertEqual(self.days(), [("auth0|tiger", MONDAY), ("auth0|other", MONDAY), ("auth0|tiger", TUESDAY)])

    def test_another_server_process_having_written_the_row_is_fine(self):
        user = CustomUser.objects.create(username="tiger", auth0_id="auth0|tiger")
        UserActivityDay.objects.create(user=user, date=MONDAY)

        with patch(LOCAL_TODAY, return_value=MONDAY):
            self.assertEqual(get_or_create_user(CLAIMS), user)

        self.assertEqual(self.days(), [("auth0|tiger", MONDAY)])

    def test_a_failed_write_never_blocks_the_login_and_is_retried(self):
        with (
            patch(LOCAL_TODAY, return_value=MONDAY),
            patch.object(UserActivityDay.objects, "bulk_create", side_effect=RuntimeError("database hiccup")),
        ):
            self.assertIsNotNone(get_or_create_user(CLAIMS))
        self.assertEqual(self.days(), [])

        with patch(LOCAL_TODAY, return_value=MONDAY):
            get_or_create_user(CLAIMS)
        self.assertEqual(self.days(), [("auth0|tiger", MONDAY)])

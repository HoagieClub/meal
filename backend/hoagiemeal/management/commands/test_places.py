"""Django management command to run the places API testing script.

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
from hoagiemeal.api.places import _test_places_open


class Command(BaseCommand):
    """Command to run the places API testing script."""

    help = "Run the places API testing script"

    def handle(self, *args, **kwargs):
        """Handle the command to run the places API testing script."""
        self.stdout.write("Running places API test...")
        results = _test_places_open()
        if results:
            self.stdout.write(self.style.SUCCESS(f"Successfully fetched {len(results)} places"))
        else:
            self.stdout.write(self.style.ERROR("Failed to fetch places data"))

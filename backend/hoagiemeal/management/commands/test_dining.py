from django.core.management.base import BaseCommand
from hoagiemeal.tests import dining_api


class Command(BaseCommand):
    help = "Run the dining API testing script"

    def handle(self, *args, **kwargs):
        dining_api.main()

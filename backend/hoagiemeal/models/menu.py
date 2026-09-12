"""Daily menus, stored as nested JSON of menu item ids."""

from django.db import models
from django.utils import timezone

from hoagiemeal.models.dining import DiningLocation


class ResidentialMenu(models.Model):
    """One meal at a residential dining hall. `menu_items` maps station -> [item ids]."""

    dining_location = models.ForeignKey(DiningLocation, on_delete=models.CASCADE, related_name="residential_menus")
    date = models.DateField(default=timezone.now, db_index=True)
    meal = models.CharField(max_length=50, db_index=True)
    menu_items = models.JSONField(default=dict)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "residential_menus"
        unique_together = ("dining_location", "date", "meal")
        indexes = [models.Index(fields=["dining_location", "date", "meal"])]

    def __str__(self):
        return f"{self.dining_location.name} - {self.meal} on {self.date}"


class RetailMenu(models.Model):
    """A retail location's menu for one day. `menu_items` maps area -> station -> [item ids]."""

    dining_location = models.ForeignKey(DiningLocation, on_delete=models.CASCADE, related_name="retail_menus")
    date = models.DateField(default=timezone.now, db_index=True)
    menu_items = models.JSONField(default=dict)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "retail_menus"
        unique_together = ("dining_location", "date")
        indexes = [models.Index(fields=["dining_location", "date"])]

    def __str__(self):
        return f"{self.dining_location.name} on {self.date}"

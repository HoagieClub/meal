"""Django models related to late meal marketplace.

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
from decimal import Decimal

from hoagiemeal.models.user import CustomUser


# class SwipeListingStatus(models.TextChoices):
#     """Status options for a swipe listing in the marketplace."""

#     ACTIVE = "AC", _("Active")
#     PENDING = "PE", _("Pending")
#     COMPLETED = "CO", _("Completed")
#     CANCELLED = "CA", _("Cancelled")
#     EXPIRED = "EX", _("Expired")


# class SwipeListing(models.Model):
#     """Represents a listing in the late meal swipe marketplace.

#     Attributes:
#         seller (CustomUser): User selling the swipe.
#         quantity (int): Number of swipes being sold.
#         price_per_swipe (Decimal): Asking price per swipe.
#         total_price (Decimal): Total price for all swipes.
#         status (str): Current status of the listing.
#         created_at (datetime): When the listing was created.
#         expires_at (datetime): When the listing expires.
#         description (str): Optional description from the seller.
#         is_negotiable (bool): Whether the price is negotiable.
#         min_quantity (int): Minimum quantity that can be purchased.

#     """

#     seller = models.ForeignKey(CustomUser, on_delete=models.CASCADE, related_name="swipe_listings")
#     quantity = models.PositiveIntegerField(
#         default=1,
#         validators=[MinValueValidator(1), MaxValueValidator(20)],
#         help_text=_("Number of swipes being sold"),
#     )
#     price_per_swipe = models.DecimalField(
#         max_digits=6,
#         decimal_places=2,
#         validators=[MinValueValidator(Decimal("0.01"))],
#         help_text=_("Asking price per swipe"),
#     )
#     total_price = models.DecimalField(
#         max_digits=8,
#         decimal_places=2,
#         validators=[MinValueValidator(Decimal("0.01"))],
#         help_text=_("Total price for all swipes"),
#     )
#     status = models.CharField(
#         max_length=2,
#         choices=SwipeListingStatus.choices,
#         default=SwipeListingStatus.ACTIVE,
#     )
#     created_at = models.DateTimeField(auto_now_add=True)
#     expires_at = models.DateTimeField()
#     description = models.TextField(blank=True)
#     is_negotiable = models.BooleanField(default=False)
#     min_quantity = models.PositiveIntegerField(
#         default=1,
#         validators=[MinValueValidator(1)],
#         help_text=_("Minimum quantity that can be purchased"),
#     )

#     class Meta:
#         """Meta class for the SwipeListing model."""

#         db_table = "swipe_listings"
#         indexes = [
#             models.Index(fields=["seller"]),
#             models.Index(fields=["status"]),
#             models.Index(fields=["price_per_swipe"]),
#             models.Index(fields=["expires_at"]),
#         ]

#     def __str__(self):
#         """Return the string representation of the SwipeListing instance.

#         Returns:
#             str: A description of the swipe listing.

#         """
#         return f"{self.seller.get_full_name()} - {self.quantity} swipes at ${self.price_per_swipe} each"

#     def save(self, *args, **kwargs):
#         """Override save to calculate total price."""
#         self.total_price = self.price_per_swipe * Decimal(str(self.quantity))
#         super().save(*args, **kwargs)


# class SwipeOffer(models.Model):
#     """Represents an offer made on a swipe listing.

#     Attributes:
#         listing (SwipeListing): The listing the offer is for.
#         buyer (CustomUser): User making the offer.
#         quantity (int): Number of swipes being offered for.
#         price_per_swipe (Decimal): Offered price per swipe.
#         total_price (Decimal): Total price for all swipes.
#         status (str): Current status of the offer.
#         created_at (datetime): When the offer was made.
#         expires_at (datetime): When the offer expires.
#         message (str): Optional message from the buyer.

#     """

#     class OfferStatus(models.TextChoices):
#         """Status options for a swipe offer."""

#         PENDING = "PE", _("Pending")
#         ACCEPTED = "AC", _("Accepted")
#         REJECTED = "RE", _("Rejected")
#         CANCELLED = "CA", _("Cancelled")
#         EXPIRED = "EX", _("Expired")
#         COMPLETED = "CO", _("Completed")

#     listing = models.ForeignKey(SwipeListing, on_delete=models.CASCADE, related_name="offers")
#     buyer = models.ForeignKey(CustomUser, on_delete=models.CASCADE, related_name="swipe_offers")
#     quantity = models.PositiveIntegerField(
#         default=1,
#         validators=[MinValueValidator(1)],
#         help_text=_("Number of swipes being offered for"),
#     )
#     price_per_swipe = models.DecimalField(
#         max_digits=6,
#         decimal_places=2,
#         validators=[MinValueValidator(Decimal("0.01"))],
#         help_text=_("Offered price per swipe"),
#     )
#     total_price = models.DecimalField(
#         max_digits=8,
#         decimal_places=2,
#         validators=[MinValueValidator(Decimal("0.01"))],
#         help_text=_("Total price for all swipes"),
#     )
#     status = models.CharField(
#         max_length=2,
#         choices=OfferStatus.choices,
#         default=OfferStatus.PENDING,
#     )
#     created_at = models.DateTimeField(auto_now_add=True)
#     expires_at = models.DateTimeField()
#     message = models.TextField(blank=True)

#     class Meta:
#         """Meta class for the SwipeOffer model."""

#         db_table = "swipe_offers"
#         indexes = [
#             models.Index(fields=["listing"]),
#             models.Index(fields=["buyer"]),
#             models.Index(fields=["status"]),
#             models.Index(fields=["created_at"]),
#         ]

#     def __str__(self):
#         """Return the string representation of the SwipeOffer instance.

#         Returns:
#             str: A description of the swipe offer.

#         """
#         return f"{self.buyer.get_full_name()} - Offer for {self.quantity} swipes at ${self.price_per_swipe} each"

#     def save(self, *args, **kwargs):
#         """Override save to calculate total price."""
#         self.total_price = self.price_per_swipe * Decimal(str(self.quantity))
#         super().save(*args, **kwargs)


# class SwipeTransactionMarketplace(models.Model):
#     """Records a completed transaction between a buyer and seller for swipes.

#     Attributes:
#         listing (SwipeListing): The original listing.
#         offer (SwipeOffer): The accepted offer (if applicable).
#         seller (CustomUser): User selling the swipe.
#         buyer (CustomUser): User buying the swipe.
#         quantity (int): Number of swipes transferred.
#         price_per_swipe (Decimal): Final price per swipe.
#         total_price (Decimal): Total price for all swipes.
#         transaction_time (datetime): When the transaction was completed.
#         payment_method (str): Method of payment.
#         transaction_id (str): External payment processor ID.
#         status (str): Current status of the transaction.

#     """

#     class TransactionStatus(models.TextChoices):
#         """Status options for a swipe transaction."""

#         PENDING = "PE", _("Pending")
#         COMPLETED = "CO", _("Completed")
#         FAILED = "FA", _("Failed")
#         REFUNDED = "RE", _("Refunded")
#         DISPUTED = "DI", _("Disputed")

#     class PaymentMethod(models.TextChoices):
#         """Payment method options."""

#         CASH = "CA", _("Cash")
#         VENMO = "VE", _("Venmo")
#         PAYPAL = "PP", _("PayPal")
#         ZELLE = "ZE", _("Zelle")
#         OTHER = "OT", _("Other")

#     listing = models.ForeignKey(SwipeListing, on_delete=models.SET_NULL, null=True, related_name="transactions")
#     offer = models.OneToOneField(
#         SwipeOffer, on_delete=models.SET_NULL, null=True, blank=True, related_name="transaction"
#     )
#     seller = models.ForeignKey(CustomUser, on_delete=models.CASCADE, related_name="sold_swipes")
#     buyer = models.ForeignKey(CustomUser, on_delete=models.CASCADE, related_name="purchased_swipes")
#     quantity = models.PositiveIntegerField(
#         default=1,
#         validators=[MinValueValidator(1)],
#         help_text=_("Number of swipes transferred"),
#     )
#     price_per_swipe = models.DecimalField(
#         max_digits=6,
#         decimal_places=2,
#         validators=[MinValueValidator(Decimal("0.01"))],
#         help_text=_("Final price per swipe"),
#     )
#     total_price = models.DecimalField(
#         max_digits=8,
#         decimal_places=2,
#         validators=[MinValueValidator(Decimal("0.01"))],
#         help_text=_("Total price for all swipes"),
#     )
#     transaction_time = models.DateTimeField(auto_now_add=True)
#     payment_method = models.CharField(
#         max_length=2,
#         choices=PaymentMethod.choices,
#         default=PaymentMethod.VENMO,
#     )
#     transaction_id = models.CharField(max_length=100, blank=True)
#     status = models.CharField(
#         max_length=2,
#         choices=TransactionStatus.choices,
#         default=TransactionStatus.PENDING,
#     )
#     notes = models.TextField(blank=True)

#     class Meta:
#         """Meta class for the SwipeTransaction model."""

#         db_table = "swipe_transactions_marketplace"
#         indexes = [
#             models.Index(fields=["seller"]),
#             models.Index(fields=["buyer"]),
#             models.Index(fields=["status"]),
#             models.Index(fields=["transaction_time"]),
#         ]

#     def __str__(self):
#         """Return the string representation of the SwipeTransaction instance.

#         Returns:
#             str: A description of the swipe transaction.

#         """
#         return f"Transaction: {self.seller.get_full_name()} to {self.buyer.get_full_name()} - {self.quantity} swipes for ${self.total_price}"

#     def save(self, *args, **kwargs):
#         """Override save to calculate total price if not set."""
#         if not self.total_price:
#             self.total_price = self.price_per_swipe * Decimal(str(self.quantity))
#         super().save(*args, **kwargs)

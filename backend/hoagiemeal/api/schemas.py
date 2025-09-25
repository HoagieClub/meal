"""API manager class for the /{base_path}/xsd|jsd endpoint from the StudentApp API.

This module provides the XML and JSON schemas for the following base paths from
the Princeton OIT API:

- dining
- places

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

import msgspec.json as msj

from hoagiemeal.utils.logger import logger
from hoagiemeal.api.student_app import StudentApp


class Schemas(StudentApp):
    """Fetch XML and JSON schemas for the /dining/, and /places/ endpoints."""

    def __init__(self):
        """Initialize the Schemas class."""
        super().__init__()
        self.DINING_XSD = "/dining/xsd"
        self.PLACES_JSD = "/places/jsd"

    def get_dining_xsd(self, to_json: bool = False) -> dict | str:
        """Fetch the XSD schema for dining."""
        response = self._make_request(self.DINING_XSD, fmt="xml")
        if to_json:
            response = self._parse_xml(response)
        return response

    def get_places_jsd(self) -> dict:
        """Fetch the JSON schema for places."""
        response = self._make_request(self.PLACES_JSD, fmt="json")
        return response


def _test_dining_xsd(to_json: bool = False):
    logger.debug("Testing dining XSD schema.")
    schemas = Schemas()
    result = schemas.get_dining_xsd()
    logger.info(f"Dining XSD: {result}")


def _test_places_jsd(formatted: bool = True):
    logger.debug("Testing places JSD schema.")
    schemas = Schemas()
    response = schemas.get_places_jsd()
    if formatted:
        response = msj.format(response, indent=0)
    logger.info(f"Places JSD: {response}")


if __name__ == "__main__":
    _test_dining_xsd(to_json=True)
    _test_places_jsd(formatted=True)

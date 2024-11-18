"""
API manager class for the /{basePath}/xsd|jsd endpoint from the StudentApp API.

This module provides the XML and JSON schemas for the following base paths from
the Princeton OIT API:

- courses
- dining
- places

Copyright © 2021-2024 Hoagie Club and affiliates.

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

from hoagiemeal.utils.deprecated import deprecated
from hoagiemeal.utils.logger import logger
from hoagiemeal.api.student_app import StudentApp


class Schemas(StudentApp):
    """
    Fetches XML and JSON schemas for the /courses/, /dining/, and /places/ endpoints.
    """

    def __init__(self):
        super().__init__()
        self.COURSES_XSD = "/courses/xsd"
        self.DINING_XSD = "/dining/xsd"
        self.COURSES_JSD = "/courses/jsd"
        self.PLACES_JSD = "/places/jsd"

    def get_courses_xsd(self, to_json: bool = False) -> dict | str:
        """Fetches the XSD schema for courses."""
        response = self._make_request(self.COURSES_XSD, fmt="xml")
        if to_json:
            response = self._parse_xml(response)
        return response

    def get_dining_xsd(self, to_json: bool = False) -> dict | str:
        """Fetches the XSD schema for dining."""
        response = self._make_request(self.DINING_XSD, fmt="xml")
        if to_json:
            response = self._parse_xml(response)
        return response

    def get_courses_jsd(self) -> dict:
        """Fetches the JSON schema for courses."""
        response = self._make_request(self.COURSES_JSD, fmt="json")
        return response

    def get_places_jsd(self) -> dict:
        """Fetches the JSON schema for places."""
        response = self._make_request(self.PLACES_JSD, fmt="json")
        return response

@deprecated(reason="This API is not used in the Hoagie Meal app.")
def test_courses_xsd(to_json: bool = False):
    logger.debug("Testing courses XSD schema.")
    schemas = Schemas()
    result = schemas.get_courses_xsd()
    logger.info(f"Courses XSD: {result}")

def test_dining_xsd(to_json: bool = False):
    logger.debug("Testing dining XSD schema.")
    schemas = Schemas()
    result = schemas.get_dining_xsd()
    logger.info(f"Dining XSD: {result}")

@deprecated(reason="This API is not used in the Hoagie Meal app.")
def test_courses_jsd(formatted: bool = True):
    logger.debug("Testing courses JSD schema.")
    schemas = Schemas()
    response = schemas.get_courses_jsd()
    if formatted:
        response = msj.format(response, indent=0)
    logger.info(f"Courses JSD: {response}")

def test_places_jsd(formatted: bool = True):
    logger.debug("Testing places JSD schema.")
    schemas = Schemas()
    response = schemas.get_places_jsd()
    if formatted:
        response = msj.format(response, indent=0)
    logger.info(f"Places JSD: {response}")

if __name__ == "__main__":
    test_courses_xsd(to_json=True)
    test_dining_xsd(to_json=True)
    test_courses_jsd(formatted=True)
    test_places_jsd(formatted=True)


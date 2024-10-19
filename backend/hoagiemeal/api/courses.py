"""
API manager class for the /courses/ endpoint from the StudentApp API.

This module fetches data from the following endpoints:

- /courses/terms
- /courses/courses
- /courses/seats
- /courses/resseats
- /courses/details

To be used as reference/template; this module is deprecated, incomplete, and will be removed.

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

from hoagiemeal.logger import logger
from hoagiemeal.utils import deprecated
from student_app import StudentApp

# TODO: This file is incomplete.
class Courses(StudentApp):
    """
    Handles functionalities related to academic courses, including term listings,
    course details, enrollment information, and seat reservations.
    """

    def __init__(self):
        super().__init__()
        self.COURSES_TERMS = "/courses/terms"
        self.COURSES_COURSES = "/courses/courses"
        self.COURSES_SEATS = "/courses/seats"
        self.COURSES_RESSEATS = "/courses/resseats"
        self.COURSES_DETAILS = "/courses/details"

    def get_terms(self, fmt: str = "json") -> dict:
        """Fetches the latest academic term?"""
        params = {"fmt": fmt}
        response = self._make_request(self.COURSES_TERMS, params=params, fmt=fmt)
        return self._parse_xml(response) if fmt == "xml" else response

    def get_courses(self, term: str = "", subject: str = "", catnum: str = "", search: str = "", fmt: str = "json") -> dict:
        """Fetches a list of courses for a given term, with optional filters."""
        params = {"term": term, "subject": subject, "catnum": catnum, "search": search, fmt: fmt}
        
        return self._make_request(self.COURSES_COURSES, params=params, fmt=fmt)

    def get_seats(self, term: str, course_ids: str, fmt: str = "json") -> dict:
        """Fetches the seat information for specified courses."""
        params = {"term": term, "course_ids": course_ids}
        return self._make_request(self.COURSES_SEATS, params=params, fmt=fmt)

    def get_reserved_seats(self, term: str, course_ids: str, fmt: str = "json") -> dict:
        """Fetches reserved seat data for specified courses."""
        params = {"term": term, "course_ids": course_ids}
        return self._make_request(self.COURSES_RESSEATS, params=params, fmt=fmt)

    def get_course_details(self, term: str, course_id: str, fmt: str = "json") -> dict:
        """Fetches detailed course information for a specific course."""
        params = {"term": term, "course_id": course_id}
        return self._make_request(self.COURSES_DETAILS, params=params, fmt=fmt)


@deprecated(reason="This API is not used in the Hoagie Meal app.")
def test_get_terms():
    courses = Courses()
    response = courses.get_terms(fmt="xml")
    logger.info(f"get_terms result: {response}")


@deprecated(reason="This API is not used in the Hoagie Meal app.")
def test_get_courses():
    courses = Courses()
    params = {
        "term": "1252",
        "subject": "COS",
        "catnum": "126",
        # "search": "Text string to search for."
        "fmt": "json",
    }
    response = courses.get_courses(**params)
    logger.info(f"get_courses result: {response}")


@deprecated(reason="This API is not used in the Hoagie Meal app.")
def test_get_seats():
    courses = Courses()
    response = courses.get_seats(term="1252", course_ids="CS101")
    logger.info(f"get_seats result: {response}")


@deprecated(reason="This API is not used in the Hoagie Meal app.")
def test_get_reserved_seats():
    courses = Courses()
    response = courses.get_reserved_seats(term="1252", course_ids="CS101")
    logger.info("get_reserved_seats result:", response)


@deprecated(reason="This API is not used in the Hoagie Meal app.")
def test_get_course_details():
    courses = Courses()
    response = courses.get_course_details(term="2024FA", course_id="CS101")
    logger.info("get_course_details result:", response)


if __name__ == "__main__":
    # test_get_terms()
    test_get_courses()
    # test_get_seats()
    # test_get_reserved_seats()
    # test_get_course_details()

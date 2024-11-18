"""Hoagie API Client Manager for communicating with the Princeton OIT API.

This module facilitates interaction with Princeton OIT's API by handling
authentication, retry logic, and efficient JSON parsing.

Access is restricted to permitted users. To be whitelisted, contact Princeton OIT.

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

import base64
import os
import requests
import xml.etree.ElementTree as ET

import msgspec.json as msj
import xmlschema
from dotenv import load_dotenv
from icalendar import Calendar
from hoagiemeal.utils.logger import logger
from msgspec import DecodeError

load_dotenv()

ACTIVE_DIRECTORY_BASE_URL = "https://api.princeton.edu:443/active-directory/"
PRINCETON_INFO_BASE_URL = "https://api.princeton.edu:443/princeton-info/"
STUDENT_APP_BASE_URL = "https://api.princeton.edu:443/student-app"
WINTER_EVENTS_BASE_URL = "https://api.princeton.edu:443/winter-events/"
REFRESH_TOKEN_URL = "https://api.princeton.edu:443/token"


class StudentApp:
    """Base class for interacting with the Princeton StudentApp API."""

    def __init__(self):
        self.CONSUMER_KEY = os.environ.get("CONSUMER_KEY")
        self.CONSUMER_SECRET = os.environ.get("CONSUMER_SECRET")
        self.ACCESS_TOKEN = os.environ.get("ACCESS_TOKEN")
        self.REFRESH_TOKEN_URL = REFRESH_TOKEN_URL
        self._refresh_token(grant_type="client_credentials")

    def _refresh_token(self, **kwargs: dict):
        """Fetch a new access token using client credentials."""
        headers = {
            "Authorization": "Basic "
            + base64.b64encode(f"{self.CONSUMER_KEY}:{self.CONSUMER_SECRET}".encode("utf-8")).decode("utf-8")
        }
        try:
            response = requests.post(self.REFRESH_TOKEN_URL, data=kwargs, headers=headers)
            response.raise_for_status()
            self.ACCESS_TOKEN = msj.decode(response.content)["access_token"]
            logger.info("Token refreshed successfully.")
        except requests.RequestException as e:
            logger.error(f"Token refresh failed: {e}")
            raise requests.RequestException(f"Token refresh failed: {e}") from e
        except DecodeError as e:
            logger.error(f"Failed to decode token refresh response: {e}")
            raise DecodeError("Failed to decode token refresh response") from e

    def _make_request(self, endpoint: str, params: dict = None, fmt: str = "json", formatted: bool = True) -> dict | str:
        """Send a GET request to the specified endpoint. Defaults to JSON format.
        
        Processing of data (e.g. decoding, formatting, etc.) should be handled externally.
        """
        headers = {
            "Authorization": f"Bearer {self.ACCESS_TOKEN}",
            "Accept": f"application/{fmt}",
        }
        url = f"{STUDENT_APP_BASE_URL}{endpoint}"
        try:
            response = requests.get(url, params=params, headers=headers)
            response.raise_for_status()
            logger.debug(f"Request to {url} successful.")
            match fmt:
                case "json":
                    response = response.content
                    return response
                case "xml":
                    response = response.text
                    return response
                case "ical":
                    response = response.text
                    return response
                case _:
                    return response
        except requests.RequestException as e:
            logger.error(f"Request to {url} failed: {e}")
            raise requests.RequestException(f"Request failed: {e}") from e

    def validate_xml(self, xml_str: str, xsd_str: str) -> bool:
        """Validate an XML string against an XSD schema provided by Princeton OIT."""
        try:
            schema = xmlschema.XMLSchema(xsd_str)
            schema.validate(xml_str)
            logger.info("XML validation successful.")
            return True
        except xmlschema.XMLSchemaValidationError as e:
            logger.error(f"XML validation error: {e}")
            return False

    def _remove_xml_namespace(self, document: ET.Element):
        """Generalized namespace removal from XML tags."""
        for element in document.iter():
            if "}" in element.tag:
                element.tag = element.tag.split("}", 1)[1] # Remove namespace
        logger.info("XML namespaces removed.")

    def _xml_to_dict(self, element: ET.Element) -> dict:
        """Convert an XML element and its children into a Python dictionary."""
        data = {element.tag: {} if element.attrib else None}
        children = list(element)

        if children:
            child_dict = {}
            for child_dict_entry in map(self._xml_to_dict, children):
                for key, value in child_dict_entry.items():
                    if key in child_dict:
                        if not isinstance(child_dict[key], list):
                            child_dict[key] = [child_dict[key]]
                        child_dict[key].append(value)
                    else:
                        child_dict[key] = value
            data = {element.tag: child_dict}

        if element.attrib:
            data[element.tag].update((key, value) for key, value in element.attrib.items())

        if element.text and element.text.strip():
            if children or element.attrib:
                data[element.tag]["text"] = element.text.strip()
            else:
                data[element.tag] = element.text.strip()

        logger.info(f"XML element {element.tag} converted to dict.")
        return data

    def _parse_xml(self, xml: str) -> dict:
        """Parse the XML response and converts it into a Python dictionary."""
        try:
            root = ET.fromstring(xml)
            self._remove_xml_namespace(root)
            logger.debug("XML parsed successfully.")
            return self._xml_to_dict(root)
        except ET.ParseError as e:
            # Log the full XML response that caused the failure
            logger.error(f"Failed to parse XML response. Raw content: {xml}")
            logger.error(f"ParseError details: {e}")
            raise ValueError(f"Failed to parse XML response: {e}") from e

    def _parse_ical(self, ical_text: str) -> dict:
        """Parse iCal text and returns a structured dictionary."""
        cal = Calendar.from_ical(ical_text)
        calendar_info = {}
        events = []

        # Explore all components and their properties
        for component in cal.walk():
            # Extract VCALENDAR properties
            if component.name == "VCALENDAR":
                calendar_info = {
                    "calname": component.get("X-WR-CALNAME"),
                    "timezone": component.get("X-WR-TIMEZONE"),
                    "prodid": component.get("PRODID"),
                    "version": component.get("VERSION"),
                }

            # Extract VEVENT properties
            elif component.name == "VEVENT":
                event = {
                    "summary": component.get("SUMMARY"),
                    "start": component.get("DTSTART").dt,
                    "end": component.get("DTEND").dt,
                    "uid": component.get("UID"),
                    "description": component.get("DESCRIPTION"),
                }
                events.append(event)

        return {
            "calendar_info": calendar_info,
            "events": events,
        }

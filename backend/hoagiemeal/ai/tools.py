"""Tool use utilities for AI agents.

This file provides a flexible and extensible system for handling tool/function calling
for AI agents.

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

from __future__ import annotations

import inspect
from abc import ABC, abstractmethod
from dataclasses import dataclass, field
from enum import Enum
from typing import Any, Dict, Generic, List, Optional, Protocol, TypedDict, TypeVar, Union, runtime_checkable

import orjson as oj
from hoagiemeal.utils.logger import logger

# Type definitions
ChunkT = TypeVar("ChunkT")  # Generic type for model-specific chunks


class ToolCall(TypedDict):
    """Base structure for a tool/function call."""

    name: str
    arguments: str


class ToolCallDict(TypedDict):
    """TypedDict for a single tool call."""

    tool_call: ToolCall


class ToolCallsListDict(TypedDict):
    """TypedDict for a list of tool calls."""

    tool_calls: List[ToolCallDict]


StreamOutput = Union[str, ToolCallsListDict]


@runtime_checkable
class ToolCallable(Protocol):
    """Protocol for callable tools that can be converted to schemas."""

    __name__: str
    __doc__: Optional[str]
    __annotations__: Dict[str, Any]


@dataclass
class ToolCallState:
    """Tracks the state of a single tool call during streaming."""

    name: Optional[str] = None
    arguments: str = ""
    _validated_json: Optional[Dict[str, Any]] = field(default=None, init=False)

    def accumulate(self, name: Optional[str] = None, arguments: Optional[str] = None) -> None:
        """Accumulate tool call data from streaming chunks."""
        if name is not None:
            self.name = name
        if arguments is not None:
            self.arguments += arguments
            self._validated_json = None

    def validate(self) -> bool:
        """Validate the accumulated tool call data."""
        if self._validated_json is not None:
            return True
        if not self.name or not self.arguments or not self.name.strip():
            return False
        try:
            self._validated_json = oj.loads(self.arguments)
            return True
        except oj.JSONDecodeError:
            return False

    def to_dict(self) -> ToolCallDict:
        """Convert the current state to the tool call dict format."""
        return {"tool_call": {"name": self.name, "arguments": self.arguments}}

    def reset(self) -> None:
        """Reset state for the next tool call."""
        self.name = None
        self.arguments = ""
        self._validated_json = None


class BaseToolProcessor(Generic[ChunkT], ABC):
    """Base class for processing tool calls from any AI model."""

    def __init__(self) -> None:
        """Initialize the tool processor."""
        self.current_tool = ToolCallState()

    def process_chunk(self, chunk: ChunkT) -> Optional[StreamOutput]:
        """Process an incoming chunk from the AI model."""
        try:
            result = self._process_raw_chunk(chunk)
            if isinstance(result, dict) and self.current_tool.validate():
                tool_result: ToolCallsListDict = {"tool_calls": [self.current_tool.to_dict()]}
                self.current_tool.reset()
                return tool_result
            return result
        except Exception as e:
            logger.error(f"Error processing chunk: {e}")
            self.current_tool.reset()
            return None

    @abstractmethod
    def _process_raw_chunk(self, chunk: ChunkT) -> Optional[StreamOutput]:
        """Process a raw chunk from the AI model."""
        raise NotImplementedError

    def reset(self) -> None:
        """Reset the processor state."""
        self.current_tool.reset()


def function_to_schema(func: ToolCallable) -> Dict[str, Any]:
    """Convert a Python function's signature to a JSON schema."""
    type_map: Dict[Any, str] = {
        str: "string",
        int: "integer",
        float: "number",
        bool: "boolean",
        list: "array",
        dict: "object",
    }

    sig = inspect.signature(func)
    params: Dict[str, Any] = {}
    required: List[str] = []

    for param_name, param in sig.parameters.items():
        annotation = param.annotation if param.annotation != inspect.Parameter.empty else str

        if isinstance(annotation, type) and issubclass(annotation, Enum):
            param_schema = {
                "type": "string",
                "enum": [e.value for e in annotation],
                "description": f"Argument: {param_name}",
            }
        elif getattr(annotation, "__origin__", None) is list:
            param_schema = {
                "type": "array",
                "items": {"type": "string"},
                "description": f"Argument: {param_name}",
            }
        elif getattr(annotation, "__origin__", None) is Union:
            non_none_types = [t for t in annotation.__args__ if t is not type(None)]
            base_type = non_none_types[0] if non_none_types else str
            param_schema = {
                "type": type_map.get(base_type, "string"),
                "description": f"Argument: {param_name}",
            }
        else:
            param_schema = {
                "type": type_map.get(annotation, "string"),
                "description": f"Argument: {param_name}",
            }

        params[param_name] = param_schema
        if param.default == inspect.Parameter.empty:
            required.append(param_name)

    return {
        "type": "function",
        "function": {
            "name": func.__name__,
            "description": (func.__doc__ or "").strip(),
            "parameters": {
                "type": "object",
                "properties": params,
                "required": required,
            },
        },
    }


# Example usage and testing
if __name__ == "__main__":

    class FakeToolProcessor(BaseToolProcessor[Dict[str, Any]]):
        """A demo processor that simulates processing streaming data."""

        def _process_raw_chunk(self, chunk: Dict[str, Any]) -> Optional[StreamOutput]:
            if "name" in chunk:
                self.current_tool.accumulate(name=chunk["name"])
                return None
            if "arguments" in chunk:
                self.current_tool.accumulate(arguments=chunk["arguments"])
                return {} if self.current_tool.validate() else None
            return str(chunk)

    def demo_add(a: int, b: int) -> int:
        """Add two numbers and return the result."""
        return a + b

    # Demo the schema generation
    print("=== Function to Schema Example ===")
    schema = function_to_schema(demo_add)
    print(oj.dumps(schema, option=oj.OPT_INDENT_2).decode("utf-8"))

    # Demo the tool processor
    print("\n=== Tool Processor Example ===")
    processor = FakeToolProcessor()

    # Simulate streaming chunks
    chunks = [{"name": "add"}, {"arguments": '{"a": 1, "b": 2}'}]

    for i, chunk in enumerate(chunks, 1):
        print(f"\nProcessing chunk {i}:", oj.dumps(chunk, option=oj.OPT_INDENT_2).decode("utf-8"))
        result = processor.process_chunk(chunk)
        if result:
            print("Output:", oj.dumps(result, option=oj.OPT_INDENT_2).decode("utf-8"))

"""Wrapper around the OpenAI API for streaming completions with support for tool usage.

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

import os
import orjson as oj

from collections.abc import Generator
from typing import Any, Callable, Dict, List, Optional, Union

from dotenv import load_dotenv
from openai import OpenAI
from openai.types.chat import ChatCompletionChunk

from hoagiemeal.utils.logger import logger
from hoagiemeal.ai.tools import (
    BaseToolProcessor,
    StreamOutput,
    function_to_schema,
)

load_dotenv()


class OpenAIToolProcessor(BaseToolProcessor[ChatCompletionChunk]):
    """Tool processor specifically for OpenAI's chat completion format."""

    def _process_raw_chunk(self, chunk: ChatCompletionChunk) -> Optional[StreamOutput]:
        """Process a chunk from OpenAI's streaming format."""
        delta = chunk.choices[0].delta
        finish_reason = chunk.choices[0].finish_reason

        if delta.content is not None:
            return delta.content

        if delta.tool_calls:
            tool_call = delta.tool_calls[0]
            if tool_call.function:
                if tool_call.function.name is not None:
                    self.current_tool.accumulate(name=tool_call.function.name)
                if tool_call.function.arguments is not None:
                    self.current_tool.accumulate(arguments=tool_call.function.arguments)

        if finish_reason == "tool_calls":
            return {}  # Empty dict triggers tool call completion in parent class

        return None


class CompletionsAPI:
    """Wrapper for the OpenAI API client."""

    def __init__(self, api_key: str, base_url: str):
        """Initialize the API client."""
        self.client = OpenAI(api_key=api_key, base_url=base_url)

    def create_chat_completion(
        self, model: str, messages: List[Dict[str, str]], tools: List[dict], **kwargs
    ) -> Union[ChatCompletionChunk, Any]:
        """Create a chat completion."""
        return self.client.chat.completions.create(
            model=model,
            messages=messages,
            tools=tools,
            **kwargs,
        )


class Completions:
    """Handles text generation and function calling via the OpenAI API."""

    def __init__(self, name: str, instructions: str, tools: Optional[List[Callable]] = None):
        """Initialize the LLM completions client."""
        self.name = name
        self.instructions = instructions
        self.tools = [function_to_schema(fn) for fn in tools] if tools else []
        self.tool_processor = OpenAIToolProcessor()

        api_key = os.environ.get("OPENAI_API_KEY")
        if not api_key:
            raise ValueError("OPENAI_API_KEY not found in environment variables")
        base_url = os.environ.get("OPENAI_BASE_URL")
        if not base_url:
            raise ValueError("OPENAI_BASE_URL not found in environment variables")

        self.completions_client = CompletionsAPI(api_key=api_key, base_url=base_url)
        logger.info("Completions client initialized with model %s", self.name)

    def generate(self, messages: List[Dict[str, str]], **kwargs) -> Union[str, Generator[StreamOutput, None, None]]:
        """Generate a response either as a full message or as a stream."""
        self.tool_processor.reset()
        all_messages = [{"role": "system", "content": self.instructions}] + messages

        try:
            chunks = self.completions_client.create_chat_completion(
                model=self.name,
                messages=all_messages,
                tools=self.tools,
                **kwargs,
            )

            if kwargs.get("stream"):
                return self._stream_generator(chunks)
            return chunks.choices[0].message.content

        except Exception as e:
            logger.error(f"Error in generate: {e}")
            raise

    def _stream_generator(
        self, chunks: Generator[ChatCompletionChunk, None, None]
    ) -> Generator[StreamOutput, None, None]:
        """Yield pieces of text or complete tool calls."""
        try:
            for chunk in chunks:
                result = self.tool_processor.process_chunk(chunk)
                if result is not None:
                    yield result
        except Exception as e:
            logger.error(f"Error in stream generation: {e}")
            self.tool_processor.reset()
            raise


if __name__ == "__main__":

    def get_weather(city: str, date: str = "today") -> str:
        """Get weather for a city on a specific date."""
        return f"Weather forecast for {city} on {date}: Sunny"

    def calculate_sum(a: int, b: int) -> int:
        """Calculate the sum of two numbers."""
        return a + b

    completions = Completions(
        name="gpt-4o-mini",
        instructions=(
            "You are a helpful assistant that can check weather and do math.\n"
            "ALWAYS use the provided functions for these tasks.\n"
            "For weather, use get_weather.\n"
            "For addition, use calculate_sum."
        ),
        tools=[get_weather, calculate_sum],
    )

    # Test 1: Regular Streaming
    print("\n=== Test 1: Regular Streaming ===")
    response = completions.generate(
        messages=[{"role": "user", "content": "Just say hello!"}],
        stream=True,
        temperature=0.1,
    )
    for chunk in response:
        if isinstance(chunk, str):
            print(chunk, end="", flush=True)
        else:
            print("\nTool call:", oj.dumps(chunk, option=oj.OPT_INDENT_2).decode("utf-8"))
    print("\n")

    # Test 2: Single Tool Call
    print("\n=== Test 2: Single Tool Call ===")
    response = completions.generate(
        messages=[
            {
                "role": "user",
                "content": "What's the weather like in San Francisco? Give a little monologue before function calling.",
            }
        ],
        stream=True,
        temperature=0.1,
    )
    for chunk in response:
        if isinstance(chunk, str):
            print(chunk, end="", flush=True)
        else:
            print("\nTool call:", oj.dumps(chunk, option=oj.OPT_INDENT_2).decode("utf-8"))
    print("\n")

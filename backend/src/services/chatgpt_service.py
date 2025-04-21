"""A service that handles sending API requests to ChatGPT and receiving the response.
The only issue is how we get the messages, but that's presumably done as well.
Task
"""

import os
from typing import Literal

from openai import OpenAI
from openai.types import ResponseFormatJSONObject, ResponseFormatText
from pydantic import BaseModel

from src.models.oatutor_hints import OatutorHints

DEFAULT_GPT_MODEL = "gpt-4o"
DEFAULT_CHAT_TYPE = "text"
DEFAULT_GPT_MODEL_STRUCTURED_OUTPUT = "gpt-4o-2024-08-06"
DEFAULT_TEMPERATURE = 1.0
MAX_TOKENS = 1000

client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

ALLOWED_CHAT_TYPES = set(["text", "json_object"])


def get_chat(
    messages: list[dict[str, str]],
    model: str = DEFAULT_GPT_MODEL,
    type: str = DEFAULT_CHAT_TYPE,
    temperature: float = DEFAULT_TEMPERATURE,
    stream: bool = True,
):
    print(
        f"get_chat(model={model}, type={type}, temperature={temperature}, stream={stream})"
    )
    # from ..app import app  # Purely for logging.

    """Send a request to the ChatGPT API for a chat completion, given the messages as a list.
    Message objects should be formatted as: {role: "my_role", content: "some content"}."""
    # app.logger.info(f"GPT receives: {messages} as messages.")

    if type not in ALLOWED_CHAT_TYPES:
        type = "text"

    return client.chat.completions.create(
        model=model,
        messages=messages,
        response_format={"type": type},
        stream=stream,
        max_tokens=MAX_TOKENS,
        temperature=temperature,
    )


class DefaultSchema(BaseModel):
    # This schema is likely not what you need; it's just a placeholder for when no other schema is available.
    # Define your actual schema here and register it with a name in the response_types dictionary.
    name: str
    email: str

    def to_json(self) -> dict:
        return {"name": self.name, "email": self.email}


response_types = {"default": DefaultSchema, "oatutor_hints": OatutorHints}
STRUCTURED_OUTPUT_SUPPORTED_MODELS = set(
    ["gpt-4o-mini-2024-07-18", "gpt-4o-2024-08-06"]
)


def get_structured_output(
    messages: list[dict[str, str]],
    response_type: str,
    model: str = DEFAULT_GPT_MODEL_STRUCTURED_OUTPUT,
    temperature: float = DEFAULT_TEMPERATURE,
    stream: bool = False,
) -> dict:
    # This method returns a Python object that conforms to the given schema as defined by the response_schema
    # Check out https://platform.openai.com/docs/guides/structured-outputs for how to define
    # the schema for structured output.
    # TL; DR: define a class that inherits from the pydantic.BaseModel class.
    # There seem to be more options that let you control the details of the properties, like the length of a string or the range of an integer.
    if model not in STRUCTURED_OUTPUT_SUPPORTED_MODELS:
        model = DEFAULT_GPT_MODEL_STRUCTURED_OUTPUT

    print(
        f"get_structured_output(response_type={response_type}, model={model}, temperature={temperature}, stream={stream})"
    )
    response_schema = response_types.get(response_type, DefaultSchema)
    return (
        client.beta.chat.completions.parse(
            model=model,
            messages=messages,
            response_format=response_schema,
            max_tokens=MAX_TOKENS,
            temperature=temperature,
        )
        .choices[0]
        .message.parsed
    ).to_json()

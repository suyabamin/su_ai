from enum import Enum
from typing import List, Optional
from pydantic import BaseModel, Field, field_validator
from app.config import MAX_MESSAGE_LENGTH, MAX_HISTORY_MESSAGES


class RoleEnum(str, Enum):
    user = "user"
    assistant = "assistant"


class ChatMessage(BaseModel):
    role: RoleEnum
    content: str = Field(..., min_length=1, max_length=MAX_MESSAGE_LENGTH)

    @field_validator("content")
    @classmethod
    def validate_content_not_blank(cls, v: str) -> str:
        stripped = v.strip()
        if not stripped:
            raise ValueError("Message content cannot be empty or only whitespace.")
        return stripped


class ChatRequest(BaseModel):
    message: str = Field(..., min_length=1, max_length=MAX_MESSAGE_LENGTH)
    history: List[ChatMessage] = Field(default_factory=list)
    model: Optional[str] = Field(default=None, max_length=100)

    @field_validator("message")
    @classmethod
    def validate_message_not_blank(cls, v: str) -> str:
        stripped = v.strip()
        if not stripped:
            raise ValueError("User message cannot be empty or only whitespace.")
        return stripped

    @field_validator("history")
    @classmethod
    def truncate_history(cls, v: List[ChatMessage]) -> List[ChatMessage]:
        # Enforce history length constraint to recent messages
        if len(v) > MAX_HISTORY_MESSAGES:
            return v[-MAX_HISTORY_MESSAGES:]
        return v


class ChatResponse(BaseModel):
    response: str
    model: str


class HealthResponse(BaseModel):
    status: str
    model: str
    configured: bool
    version: str


class RootResponse(BaseModel):
    status: str
    app: str
    version: str

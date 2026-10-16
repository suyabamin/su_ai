import logging
from typing import List, Optional, AsyncGenerator
from fastapi import HTTPException, status
from google import genai
from google.genai import types
from google.genai.errors import APIError

from app.config import GEMINI_API_KEY, GEMINI_MODEL, SYSTEM_INSTRUCTION
from app.schemas import ChatMessage

logger = logging.getLogger(__name__)


class GeminiService:
    def __init__(self):
        self._default_model = GEMINI_MODEL

    def _get_client(self) -> genai.Client:
        key = GEMINI_API_KEY
        if not key or key == "your_api_key_here":
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail="API key is not configured on the server. Please set GEMINI_API_KEY in backend/.env"
            )
        return genai.Client(api_key=key)

    def _build_contents(self, message: str, history: List[ChatMessage]) -> List[types.Content]:
        contents: List[types.Content] = []
        for msg in history:
            role = "user" if msg.role == "user" else "model"
            contents.append(
                types.Content(
                    role=role,
                    parts=[types.Part.from_text(text=msg.content)]
                )
            )

        contents.append(
            types.Content(
                role="user",
                parts=[types.Part.from_text(text=message)]
            )
        )
        return contents

    async def generate_chat_response(
        self,
        message: str,
        history: List[ChatMessage],
        model: Optional[str] = None
    ) -> dict:
        client = self._get_client()
        model_to_use = model.strip() if (model and model.strip()) else self._default_model
        contents = self._build_contents(message, history)

        try:
            response = client.models.generate_content(
                model=model_to_use,
                contents=contents,
                config=types.GenerateContentConfig(
                    system_instruction=SYSTEM_INSTRUCTION,
                    temperature=0.7,
                )
            )

            response_text = ""
            if response.text:
                response_text = response.text.strip()
            elif response.candidates:
                candidate = response.candidates[0]
                if candidate.content and candidate.content.parts:
                    parts_text = [p.text for p in candidate.content.parts if getattr(p, "text", None)]
                    response_text = "".join(parts_text).strip()

            if not response_text:
                response_text = (
                    "No response was returned by the AI service. "
                    "This may be due to safety filters or input restrictions."
                )

            return {
                "response": response_text,
                "model": model_to_use
            }

        except APIError as e:
            logger.error("AI API error: %s", getattr(e, "message", str(e)))
            code = getattr(e, "code", None)
            error_msg = str(e).lower()

            if code == 429 or "quota" in error_msg or "resource_exhausted" in error_msg:
                raise HTTPException(
                    status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                    detail="AI service quota exceeded. Please try again later."
                )
            elif code in (400, 401, 403) or "api_key" in error_msg or "unregistered" in error_msg or "permission" in error_msg:
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Authentication failed. Please verify the server API key configuration."
                )
            elif code == 404 or "not found" in error_msg or "is not supported" in error_msg:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="The requested AI model was not found or is no longer supported."
                )
            else:
                raise HTTPException(
                    status_code=status.HTTP_502_BAD_GATEWAY,
                    detail="AI service returned an error while generating a response. Please try again."
                )

        except HTTPException:
            raise
        except Exception as e:
            logger.error("Unexpected error in AI service: %s", str(e))
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="An unexpected error occurred while communicating with the AI service. Please try again."
            )

    async def generate_chat_stream(
        self,
        message: str,
        history: List[ChatMessage],
        model: Optional[str] = None
    ) -> AsyncGenerator[str, None]:
        client = self._get_client()
        model_to_use = model.strip() if (model and model.strip()) else self._default_model
        contents = self._build_contents(message, history)

        try:
            response_stream = await client.aio.models.generate_content_stream(
                model=model_to_use,
                contents=contents,
                config=types.GenerateContentConfig(
                    system_instruction=SYSTEM_INSTRUCTION,
                    temperature=0.7,
                )
            )

            has_yielded = False
            async for chunk in response_stream:
                text = ""
                if chunk.text:
                    text = chunk.text
                elif chunk.candidates and chunk.candidates[0].content and chunk.candidates[0].content.parts:
                    parts = [p.text for p in chunk.candidates[0].content.parts if getattr(p, "text", None)]
                    text = "".join(parts)

                if text:
                    has_yielded = True
                    yield text

            if not has_yielded:
                yield "I was unable to produce a response. Please rephrase or try another prompt."

        except APIError as e:
            logger.error("AI API streaming error: %s", getattr(e, "message", str(e)))
            code = getattr(e, "code", None)
            error_msg = str(e).lower()

            if code == 429 or "quota" in error_msg or "resource_exhausted" in error_msg:
                raise HTTPException(
                    status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                    detail="AI service quota exceeded. Please try again later."
                )
            elif code in (400, 401, 403) or "api_key" in error_msg:
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Authentication failed. Please verify the server API key configuration."
                )
            elif code == 404:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="The requested AI model was not found."
                )
            else:
                raise HTTPException(
                    status_code=status.HTTP_502_BAD_GATEWAY,
                    detail="AI service returned an error while streaming. Please try again."
                )
        except HTTPException:
            raise
        except Exception as e:
            logger.error("Unexpected error in AI stream: %s", str(e))
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="An unexpected error occurred while communicating with the AI service."
            )


gemini_service = GeminiService()

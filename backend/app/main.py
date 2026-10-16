import json
from fastapi import FastAPI, HTTPException, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, StreamingResponse
from fastapi.exceptions import RequestValidationError

from app import __version__
from app.config import ALLOWED_ORIGINS, GEMINI_API_KEY, GEMINI_MODEL
from app.schemas import ChatRequest, ChatResponse, HealthResponse, RootResponse
from app.services.gemini_service import gemini_service

app = FastAPI(
    title="SuAI API",
    description="High-performance backend for SuAI Chatbot",
    version=__version__,
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["*"],
)


@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    first_error = exc.errors()[0] if exc.errors() else {}
    msg = first_error.get("msg", "Invalid request payload")
    field = ".".join(str(loc) for loc in first_error.get("loc", []))
    detail = f"{field}: {msg}" if field else msg

    return JSONResponse(
        status_code=status.HTTP_422_UNPROCESSABLE_CONTENT,
        content={"detail": detail, "code": "VALIDATION_ERROR"}
    )


@app.exception_handler(HTTPException)
async def http_exception_handler(request: Request, exc: HTTPException):
    return JSONResponse(
        status_code=exc.status_code,
        content={"detail": exc.detail, "code": f"HTTP_{exc.status_code}"}
    )


@app.exception_handler(Exception)
async def generic_exception_handler(request: Request, exc: Exception):
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={"detail": "An internal server error occurred.", "code": "INTERNAL_SERVER_ERROR"}
    )


@app.get("/", response_model=RootResponse)
async def root():
    """Application root endpoint providing service status."""
    return RootResponse(
        status="ok",
        app="SuAI API",
        version=__version__
    )


@app.get("/health", response_model=HealthResponse)
async def health_check():
    """
    Health check endpoint reporting configuration state.
    Secrets and internal sensitive details are strictly excluded.
    """
    is_configured = bool(
        GEMINI_API_KEY
        and GEMINI_API_KEY.strip()
        and GEMINI_API_KEY.strip() != "your_api_key_here"
    )

    return HealthResponse(
        status="healthy",
        model=GEMINI_MODEL,
        configured=is_configured,
        version=__version__
    )


@app.post("/chat", response_model=ChatResponse)
async def chat(request: ChatRequest):
    """
    Synchronous response generation endpoint (backward compatible).
    """
    result = await gemini_service.generate_chat_response(
        message=request.message,
        history=request.history,
        model=request.model
    )
    return ChatResponse(
        response=result["response"],
        model=result["model"]
    )


@app.post("/chat/stream")
async def chat_stream(request: Request, body: ChatRequest):
    """
    Server-Sent Events (SSE) streaming endpoint.
    Emits incremental response tokens and supports client disconnection / stop generation.
    """
    async def sse_generator():
        try:
            async for chunk in gemini_service.generate_chat_stream(
                message=body.message,
                history=body.history,
                model=body.model
            ):
                if await request.is_disconnected():
                    break
                payload = json.dumps({"chunk": chunk})
                yield f"data: {payload}\n\n"

            yield f"data: {json.dumps({'done': True})}\n\n"

        except HTTPException as http_exc:
            err_payload = json.dumps({"error": http_exc.detail, "status": http_exc.status_code})
            yield f"data: {err_payload}\n\n"
        except Exception as e:
            err_payload = json.dumps({"error": "An error occurred while streaming the AI response."})
            yield f"data: {err_payload}\n\n"

    return StreamingResponse(
        sse_generator(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",
        }
    )

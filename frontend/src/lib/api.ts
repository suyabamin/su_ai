import type { BackendHealth } from '../types/chat';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export interface ChatApiMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface ChatApiRequest {
  message: string;
  history: ChatApiMessage[];
}

export class ApiError extends Error {
  public code?: string;
  public status?: number;

  constructor(message: string, status?: number, code?: string) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
  }
}

export const checkBackendHealth = async (): Promise<BackendHealth> => {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);

    const response = await fetch(`${API_BASE_URL}/health`, {
      method: 'GET',
      headers: { Accept: 'application/json' },
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new ApiError(`Health check failed with status: ${response.status}`, response.status);
    }

    const data = await response.json();
    return {
      status: data.status || 'unknown',
      configured: Boolean(data.configured),
      version: data.version || '1.0.0',
    };
  } catch (err: unknown) {
    if (err instanceof ApiError) throw err;
    if (err instanceof Error && err.name === 'AbortError') {
      throw new ApiError('Backend health check timed out.', 504);
    }
    throw new ApiError('Unable to connect to backend server.', 503);
  }
};

/**
 * Genuine Server-Sent Events (SSE) streaming chat client.
 * Calls onChunk callback progressively as incremental text arrives.
 * Gracefully handles abort signals (Stop generation).
 */
export const streamChatMessage = async (
  message: string,
  history: ChatApiMessage[],
  onChunk: (accumulatedText: string) => void,
  signal?: AbortSignal
): Promise<string> => {
  const payload: ChatApiRequest = {
    message,
    history,
  };

  let response: Response;
  try {
    response = await fetch(`${API_BASE_URL}/chat/stream`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'text/event-stream',
      },
      body: JSON.stringify(payload),
      signal,
    });
  } catch (err: unknown) {
    if (signal?.aborted) {
      return '';
    }
    if (err instanceof Error && err.name === 'AbortError') {
      return '';
    }
    throw new ApiError(
      'Unable to connect to the server. Please ensure the backend is running.',
      503
    );
  }

  if (!response.ok) {
    let errorMessage = 'An error occurred while contacting the AI service.';
    try {
      const errorJson = await response.json();
      if (errorJson.detail) errorMessage = errorJson.detail;
    } catch {
      errorMessage = `Server returned HTTP ${response.status}`;
    }
    throw new ApiError(errorMessage, response.status);
  }

  const reader = response.body?.getReader();
  if (!reader) {
    throw new ApiError('Streaming response body is unavailable.', 500);
  }

  const decoder = new TextDecoder();
  let buffer = '';
  let fullText = '';

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        const trimmed = line.trim();
        if (trimmed.startsWith('data:')) {
          const jsonStr = trimmed.slice(5).trim();
          if (!jsonStr) continue;
          try {
            const parsed = JSON.parse(jsonStr);
            if (parsed.error) {
              throw new ApiError(parsed.error, parsed.status || 500);
            }
            if (parsed.chunk) {
              fullText += parsed.chunk;
              onChunk(fullText);
            }
          } catch (e) {
            if (e instanceof ApiError) throw e;
          }
        }
      }
    }
  } catch (err: unknown) {
    if (signal?.aborted) {
      return fullText;
    }
    if (err instanceof Error && err.name === 'AbortError') {
      return fullText;
    }
    throw err;
  }

  return fullText;
};

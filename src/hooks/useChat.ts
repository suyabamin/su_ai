import { useState, useEffect, useCallback, useRef } from 'react';
import type { Conversation, Message, BackendHealth, ThemeMode } from '../types/chat';
import {
  getStoredConversations,
  saveStoredConversations,
  getStoredActiveId,
  saveStoredActiveId,
  getStoredTheme,
  saveStoredTheme,
} from '../lib/storage';
import { checkBackendHealth, streamChatMessage, ApiError } from '../lib/api';

export const useChat = () => {
  const [conversations, setConversations] = useState<Conversation[]>(() => getStoredConversations());
  const [activeId, setActiveId] = useState<string | null>(() => {
    const stored = getStoredConversations();
    const storedActive = getStoredActiveId();
    if (storedActive && stored.some((c) => c.id === storedActive)) {
      return storedActive;
    }
    return stored.length > 0 ? stored[0].id : null;
  });
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [streamingMessage, setStreamingMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [backendHealth, setBackendHealth] = useState<BackendHealth | null>(null);
  const [theme, setTheme] = useState<ThemeMode>(getStoredTheme());

  const activeIdRef = useRef<string | null>(activeId);
  const conversationsRef = useRef<Conversation[]>(conversations);

  useEffect(() => {
    activeIdRef.current = activeId;
  }, [activeId]);

  useEffect(() => {
    conversationsRef.current = conversations;
  }, [conversations]);

  const abortControllerRef = useRef<AbortController | null>(null);
  const latestStreamingTextRef = useRef<string>('');

  // Save conversations to storage (batched when conversations change, NOT per token)
  useEffect(() => {
    saveStoredConversations(conversations);
  }, [conversations]);

  // Save active ID whenever it changes
  useEffect(() => {
    saveStoredActiveId(activeId);
  }, [activeId]);

  // Theme synchronization with html class
  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    saveStoredTheme(theme);
  }, [theme]);

  // Health check on mount
  const refreshHealth = useCallback(async () => {
    try {
      const health = await checkBackendHealth();
      setBackendHealth(health);
    } catch {
      setBackendHealth({
        status: 'error',
        configured: false,
        version: '1.0.0',
      });
    }
  }, []);

  useEffect(() => {
    let isMounted = true;
    checkBackendHealth()
      .then((health) => {
        if (isMounted) setBackendHealth(health);
      })
      .catch(() => {
        if (isMounted) {
          setBackendHealth({
            status: 'error',
            configured: false,
            version: '1.0.0',
          });
        }
      });
    return () => {
      isMounted = false;
    };
  }, []);

  const activeConversation = conversations.find((c) => c.id === activeId) || null;

  const toggleTheme = useCallback(() => {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
  }, []);

  const createNewChat = useCallback(() => {
    // If generation is active, abort cleanly before starting new
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setStreamingMessage(null);
    setIsLoading(false);

    const newConv: Conversation = {
      id: 'conv_' + Date.now() + '_' + Math.random().toString(36).slice(2, 7),
      title: 'New Conversation',
      messages: [],
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    setConversations((prev) => [newConv, ...prev]);
    setActiveId(newConv.id);
    setError(null);
    return newConv.id;
  }, []);

  const selectConversation = useCallback((id: string) => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setStreamingMessage(null);
    setIsLoading(false);
    setActiveId(id);
    setError(null);
  }, []);

  const deleteConversation = useCallback((id: string) => {
    if (activeIdRef.current === id && abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setConversations((prev) => {
      const filtered = prev.filter((c) => c.id !== id);
      if (activeIdRef.current === id) {
        setActiveId(filtered.length > 0 ? filtered[0].id : null);
      }
      return filtered;
    });
  }, []);

  const renameConversation = useCallback((id: string, newTitle: string) => {
    const cleanTitle = newTitle.trim();
    if (!cleanTitle) return;

    setConversations((prev) =>
      prev.map((c) => (c.id === id ? { ...c, title: cleanTitle, updatedAt: Date.now() } : c))
    );
  }, []);

  const clearAllConversations = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setStreamingMessage(null);
    setIsLoading(false);
    setConversations([]);
    setActiveId(null);
    setError(null);
  }, []);

  const stopGeneration = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }

    const partialText = latestStreamingTextRef.current.trim();
    const targetId = activeIdRef.current;

    // Preserve partial text if any was generated
    if (partialText && targetId) {
      const assistantMessage: Message = {
        id: 'msg_' + Date.now() + '_' + Math.random().toString(36).slice(2, 7),
        role: 'assistant',
        content: partialText,
        timestamp: Date.now(),
      };

      setConversations((prev) =>
        prev.map((c) =>
          c.id === targetId
            ? {
                ...c,
                messages: [...c.messages, assistantMessage],
                updatedAt: Date.now(),
              }
            : c
        )
      );
    }

    setStreamingMessage(null);
    setIsLoading(false);
  }, []);

  const sendMessage = async (rawContent: string) => {
    const content = rawContent.trim();
    if (!content || isLoading) return;

    setError(null);

    let targetConvId = activeIdRef.current;
    let currentConv = conversationsRef.current.find((c) => c.id === targetConvId);

    // If no active conversation exists, create one
    if (!targetConvId || !currentConv) {
      const newConv: Conversation = {
        id: 'conv_' + Date.now() + '_' + Math.random().toString(36).slice(2, 7),
        title: content.slice(0, 32) + (content.length > 32 ? '...' : ''),
        messages: [],
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };
      targetConvId = newConv.id;
      currentConv = newConv;
      setConversations((prev) => [newConv, ...prev]);
      setActiveId(newConv.id);
    }

    const userMessage: Message = {
      id: 'msg_' + Date.now() + '_' + Math.random().toString(36).slice(2, 7),
      role: 'user',
      content,
      timestamp: Date.now(),
    };

    // Auto-generate title from first user query
    const shouldUpdateTitle =
      currentConv.messages.length === 0 || currentConv.title === 'New Conversation';
    const newTitle = shouldUpdateTitle
      ? content.slice(0, 32) + (content.length > 32 ? '...' : '')
      : currentConv.title;

    // Update conversation with user message immediately
    const updatedMessages = [...currentConv.messages, userMessage];
    setConversations((prev) =>
      prev.map((c) =>
        c.id === targetConvId
          ? {
              ...c,
              title: newTitle,
              messages: updatedMessages,
              updatedAt: Date.now(),
            }
          : c
      )
    );

    // Prepare streaming session
    const controller = new AbortController();
    abortControllerRef.current = controller;
    latestStreamingTextRef.current = '';
    setStreamingMessage('');
    setIsLoading(true);

    try {
      const historyPayload = currentConv.messages
        .filter((m) => !m.isError)
        .map((m) => ({
          role: m.role,
          content: m.content,
        }));

      const fullResponse = await streamChatMessage(
        content,
        historyPayload,
        (incrementalText) => {
          latestStreamingTextRef.current = incrementalText;
          setStreamingMessage(incrementalText);
        },
        controller.signal
      );

      // Check if aborted mid-flight
      if (controller.signal.aborted) {
        return;
      }

      const finalText = fullResponse.trim();
      if (finalText) {
        const assistantMessage: Message = {
          id: 'msg_' + Date.now() + '_' + Math.random().toString(36).slice(2, 7),
          role: 'assistant',
          content: finalText,
          timestamp: Date.now(),
        };

        setConversations((prev) =>
          prev.map((c) =>
            c.id === targetConvId
              ? {
                  ...c,
                  messages: [...c.messages, assistantMessage],
                  updatedAt: Date.now(),
                }
              : c
          )
        );
      }
    } catch (err: unknown) {
      if (controller.signal.aborted) {
        return;
      }
      let errMsg = 'Unable to get response. Please try again.';
      if (err instanceof ApiError) {
        errMsg = err.message;
      } else if (err instanceof Error) {
        errMsg = err.message;
      }
      setError(errMsg);
    } finally {
      abortControllerRef.current = null;
      setStreamingMessage(null);
      setIsLoading(false);
    }
  };

  const retryLastMessage = async () => {
    if (!activeConversation || activeConversation.messages.length === 0 || isLoading) return;

    const lastUserMessage = [...activeConversation.messages]
      .reverse()
      .find((m) => m.role === 'user');

    if (!lastUserMessage) return;

    // Retry sending the message
    await sendMessage(lastUserMessage.content);
  };

  const exportConversation = (format: 'markdown' | 'text') => {
    if (!activeConversation) return;

    let content = '';
    const dateStr = new Date(activeConversation.createdAt).toLocaleString();

    if (format === 'markdown') {
      content += `# ${activeConversation.title}\n`;
      content += `*Exported from SuAI on ${dateStr}*\n\n---\n\n`;

      activeConversation.messages.forEach((msg) => {
        const roleName = msg.role === 'user' ? '### User' : '### SuAI';
        content += `${roleName}\n\n${msg.content}\n\n---\n\n`;
      });
    } else {
      content += `Conversation: ${activeConversation.title}\n`;
      content += `Exported: ${dateStr}\n\n========================================\n\n`;

      activeConversation.messages.forEach((msg) => {
        const roleName = msg.role === 'user' ? 'User' : 'SuAI';
        content += `[${roleName}]:\n${msg.content}\n\n----------------------------------------\n\n`;
      });
    }

    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    const filename = `${activeConversation.title.replace(/[^a-z0-9_-]/gi, '_') || 'conversation'}.${
      format === 'markdown' ? 'md' : 'txt'
    }`;
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return {
    conversations,
    activeConversation,
    activeId,
    isLoading,
    streamingMessage,
    error,
    backendHealth,
    theme,
    toggleTheme,
    createNewChat,
    selectConversation,
    deleteConversation,
    renameConversation,
    clearAllConversations,
    sendMessage,
    stopGeneration,
    retryLastMessage,
    exportConversation,
    refreshHealth,
  };
};

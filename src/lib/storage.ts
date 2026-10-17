import type { Conversation, ThemeMode } from '../types/chat';

const STORAGE_KEYS = {
  CONVERSATIONS: 'suai_conversations_v1',
  LEGACY_CONVERSATIONS: 'gemini_chat_conversations_v1',
  ACTIVE_ID: 'suai_active_id_v1',
  LEGACY_ACTIVE_ID: 'gemini_chat_active_id_v1',
  THEME: 'suai_theme_v1',
  LEGACY_SETTINGS: 'gemini_chat_settings_v1',
};

export const getStoredConversations = (): Conversation[] => {
  try {
    // Check primary key first
    let raw = localStorage.getItem(STORAGE_KEYS.CONVERSATIONS);
    // If not found, check legacy key to preserve previous chat history seamlessly
    if (!raw) {
      raw = localStorage.getItem(STORAGE_KEYS.LEGACY_CONVERSATIONS);
    }

    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];

    return parsed.filter(
      (item) =>
        item &&
        typeof item.id === 'string' &&
        typeof item.title === 'string' &&
        Array.isArray(item.messages)
    );
  } catch (err) {
    console.error('Failed to load conversations from storage:', err);
    return [];
  }
};

export const saveStoredConversations = (conversations: Conversation[]): void => {
  try {
    localStorage.setItem(STORAGE_KEYS.CONVERSATIONS, JSON.stringify(conversations));
  } catch (err) {
    console.error('Failed to save conversations to storage:', err);
  }
};

export const getStoredActiveId = (): string | null => {
  try {
    return (
      localStorage.getItem(STORAGE_KEYS.ACTIVE_ID) ||
      localStorage.getItem(STORAGE_KEYS.LEGACY_ACTIVE_ID)
    );
  } catch (err) {
    console.error('Failed to get active conversation ID:', err);
    return null;
  }
};

export const saveStoredActiveId = (id: string | null): void => {
  try {
    if (id) {
      localStorage.setItem(STORAGE_KEYS.ACTIVE_ID, id);
    } else {
      localStorage.removeItem(STORAGE_KEYS.ACTIVE_ID);
    }
  } catch (err) {
    console.error('Failed to save active conversation ID:', err);
  }
};

export const getStoredTheme = (): ThemeMode => {
  try {
    const rawTheme = localStorage.getItem(STORAGE_KEYS.THEME);
    if (rawTheme === 'dark' || rawTheme === 'light') {
      return rawTheme;
    }
    // Check legacy settings if present
    const legacy = localStorage.getItem(STORAGE_KEYS.LEGACY_SETTINGS);
    if (legacy) {
      const parsed = JSON.parse(legacy);
      if (parsed.theme === 'dark') return 'dark';
    }
    // Respect system preference as default
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      return 'dark';
    }
    return 'light';
  } catch {
    return 'light';
  }
};

export const saveStoredTheme = (theme: ThemeMode): void => {
  try {
    localStorage.setItem(STORAGE_KEYS.THEME, theme);
  } catch (err) {
    console.error('Failed to save theme:', err);
  }
};

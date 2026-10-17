import React, { useState, useRef, useEffect } from 'react';
import {
  Menu,
  Sun,
  Moon,
  Download,
  FileText,
  FileCode,
  SquarePen,
} from 'lucide-react';
import type { BackendHealth, ThemeMode } from '../types/chat';
import { SuAILogo } from './SuAILogo';

interface HeaderProps {
  conversationTitle: string;
  theme: ThemeMode;
  backendHealth: BackendHealth | null;
  onToggleTheme: () => void;
  onOpenMobileMenu: () => void;
  onNewChat: () => void;
  onExport: (format: 'markdown' | 'text') => void;
  hasMessages: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  conversationTitle,
  theme,
  backendHealth,
  onToggleTheme,
  onOpenMobileMenu,
  onNewChat,
  onExport,
  hasMessages,
}) => {
  const [showExportMenu, setShowExportMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setShowExportMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const isOnline = backendHealth?.status === 'healthy';

  return (
    <header className="h-14 border-b border-neutral-200/70 dark:border-neutral-800/80 bg-white/80 dark:bg-[#0c1017]/80 backdrop-blur-md px-3.5 md:px-5 flex items-center justify-between z-10 select-none">
      {/* Left section: mobile hamburger & title */}
      <div className="flex items-center gap-2.5 min-w-0">
        <button
          onClick={onOpenMobileMenu}
          aria-label="Open sidebar"
          className="md:hidden p-2 rounded-lg text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors min-w-[40px] min-h-[40px] flex items-center justify-center"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Brand identity on mobile header when no desktop sidebar visible */}
        <div className="flex items-center gap-2 min-w-0">
          <div className="md:hidden flex items-center gap-1.5 text-neutral-900 dark:text-neutral-100 font-semibold text-sm">
            <SuAILogo size={18} />
            <span>SuAI</span>
            <span className="text-neutral-300 dark:text-neutral-700">/</span>
          </div>

          <h2 className="text-xs md:text-sm font-medium text-neutral-700 dark:text-neutral-300 truncate max-w-[180px] sm:max-w-xs md:max-w-md">
            {conversationTitle && conversationTitle !== 'New Conversation' ? conversationTitle : 'New chat'}
          </h2>
        </div>
      </div>

      {/* Right controls */}
      <div className="flex items-center gap-1 sm:gap-2">
        {/* Subtle Online Dot */}
        <div
          title={isOnline ? 'SuAI is ready' : 'Connecting to service...'}
          className="flex items-center gap-1.5 px-2 py-1 text-xs text-neutral-500"
        >
          <span
            className={`w-2 h-2 rounded-full ${
              isOnline ? 'bg-emerald-500 animate-pulse' : 'bg-neutral-400'
            }`}
          />
        </div>

        {/* Mobile Quick New Chat */}
        <button
          onClick={onNewChat}
          title="New chat"
          aria-label="New chat"
          className="md:hidden p-2 rounded-lg text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors min-w-[40px] min-h-[40px] flex items-center justify-center"
        >
          <SquarePen className="w-4 h-4" />
        </button>

        {/* Export Menu */}
        {hasMessages && (
          <div className="relative" ref={menuRef}>
            <button
              onClick={() => setShowExportMenu(!showExportMenu)}
              aria-label="Export conversation"
              title="Export conversation"
              className="p-2 rounded-lg text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800 hover:text-neutral-900 dark:hover:text-neutral-100 transition-colors min-w-[40px] min-h-[40px] flex items-center justify-center"
            >
              <Download className="w-4 h-4" />
            </button>

            {showExportMenu && (
              <div className="absolute right-0 mt-2 w-48 rounded-xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 shadow-lg py-1.5 z-50 text-xs animate-in fade-in zoom-in-95 duration-100">
                <button
                  onClick={() => {
                    onExport('markdown');
                    setShowExportMenu(false);
                  }}
                  className="w-full px-3.5 py-2 flex items-center gap-2.5 text-neutral-700 dark:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800/80"
                >
                  <FileCode className="w-4 h-4 text-neutral-500" />
                  <span>Export Markdown (.md)</span>
                </button>
                <button
                  onClick={() => {
                    onExport('text');
                    setShowExportMenu(false);
                  }}
                  className="w-full px-3.5 py-2 flex items-center gap-2.5 text-neutral-700 dark:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800/80"
                >
                  <FileText className="w-4 h-4 text-neutral-500" />
                  <span>Export Plain Text (.txt)</span>
                </button>
              </div>
            )}
          </div>
        )}

        {/* Theme Toggle */}
        <button
          onClick={onToggleTheme}
          aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
          title={theme === 'dark' ? 'Light mode' : 'Dark mode'}
          className="p-2 rounded-lg text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800 hover:text-neutral-900 dark:hover:text-neutral-100 transition-colors min-w-[40px] min-h-[40px] flex items-center justify-center"
        >
          {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
        </button>
      </div>
    </header>
  );
};

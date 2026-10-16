import React, { useState } from 'react';
import {
  MessageSquare,
  Trash2,
  Pencil,
  Check,
  X,
  PanelLeftClose,
  PanelLeft,
  AlertTriangle,
  SquarePen,
} from 'lucide-react';
import type { Conversation } from '../types/chat';
import { SuAILogo } from './SuAILogo';

interface SidebarProps {
  conversations: Conversation[];
  activeId: string | null;
  isOpen: boolean;
  isMobileOpen: boolean;
  onToggleDesktop: () => void;
  onCloseMobile: () => void;
  onSelectConversation: (id: string) => void;
  onNewChat: () => void;
  onRenameConversation: (id: string, newTitle: string) => void;
  onDeleteConversation: (id: string) => void;
  onClearAll: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  conversations,
  activeId,
  isOpen,
  isMobileOpen,
  onToggleDesktop,
  onCloseMobile,
  onSelectConversation,
  onNewChat,
  onRenameConversation,
  onDeleteConversation,
  onClearAll,
}) => {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  const startRename = (conv: Conversation, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingId(conv.id);
    setEditTitle(conv.title);
  };

  const saveRename = (id: string, e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (editTitle.trim()) {
      onRenameConversation(id, editTitle.trim());
    }
    setEditingId(null);
  };

  const cancelRename = (e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingId(null);
  };

  const handleDelete = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    onDeleteConversation(id);
  };

  const handleSelect = (id: string) => {
    onSelectConversation(id);
    onCloseMobile();
  };

  const handleNewChat = () => {
    onNewChat();
    onCloseMobile();
  };

  const content = (
    <div className="flex flex-col h-full bg-[#f9fafb] dark:bg-[#0c1017] border-r border-neutral-200/80 dark:border-neutral-800/80 text-neutral-800 dark:text-neutral-200 select-none">
      {/* Top Header / Brand */}
      <div className="flex items-center justify-between px-4 py-3.5 border-b border-neutral-200/70 dark:border-neutral-800/80">
        <div className="flex items-center gap-2.5">
          <SuAILogo size={22} className="text-neutral-900 dark:text-neutral-100" />
          <span className="font-semibold text-base tracking-tight text-neutral-900 dark:text-neutral-100">
            SuAI
          </span>
        </div>
        <button
          onClick={onToggleDesktop}
          aria-label="Collapse sidebar"
          title="Collapse sidebar"
          className="hidden md:flex p-1.5 rounded-lg text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 hover:bg-neutral-200/70 dark:hover:bg-neutral-800/80 transition-colors"
        >
          <PanelLeftClose className="w-4 h-4" />
        </button>
      </div>

      {/* New Chat Button */}
      <div className="p-3">
        <button
          onClick={handleNewChat}
          className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl bg-white dark:bg-neutral-800/70 border border-neutral-200/80 dark:border-neutral-700/60 text-neutral-800 dark:text-neutral-200 text-xs sm:text-sm font-medium hover:bg-neutral-100/80 dark:hover:bg-neutral-700/60 shadow-2xs transition-all group"
        >
          <span className="flex items-center gap-2">
            <SquarePen className="w-4 h-4 text-neutral-500 dark:text-neutral-400 group-hover:text-neutral-900 dark:group-hover:text-neutral-100 transition-colors" />
            <span>New chat</span>
          </span>
        </button>
      </div>

      {/* Conversation List */}
      <div className="flex-1 overflow-y-auto px-2 py-1 space-y-0.5">
        <div className="px-3 py-1.5 text-[11px] font-semibold text-neutral-400 dark:text-neutral-500 uppercase tracking-wider">
          Conversations
        </div>

        {conversations.length === 0 ? (
          <div className="px-3 py-10 text-center text-xs text-neutral-400 dark:text-neutral-500 leading-relaxed">
            No conversations yet.
          </div>
        ) : (
          conversations.map((conv) => {
            const isActive = conv.id === activeId;
            const isEditing = editingId === conv.id;

            return (
              <div
                key={conv.id}
                onClick={() => handleSelect(conv.id)}
                className={`group relative flex items-center justify-between px-3 py-2 rounded-xl text-xs sm:text-sm cursor-pointer transition-all ${
                  isActive
                    ? 'bg-neutral-200/70 dark:bg-neutral-800 text-neutral-900 dark:text-neutral-50 font-medium'
                    : 'text-neutral-600 dark:text-neutral-400 hover:bg-neutral-200/40 dark:hover:bg-neutral-800/50 hover:text-neutral-900 dark:hover:text-neutral-200'
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-0 flex-1 mr-2">
                  <MessageSquare className="w-3.5 h-3.5 flex-shrink-0 opacity-60" />
                  {isEditing ? (
                    <form
                      onSubmit={(e) => saveRename(conv.id, e)}
                      onClick={(e) => e.stopPropagation()}
                      className="flex-1 flex items-center gap-1"
                    >
                      <input
                        type="text"
                        value={editTitle}
                        onChange={(e) => setEditTitle(e.target.value)}
                        autoFocus
                        onKeyDown={(e) => {
                          if (e.key === 'Escape') setEditingId(null);
                        }}
                        className="w-full px-1.5 py-0.5 rounded text-xs bg-white dark:bg-neutral-900 border border-neutral-400 dark:border-neutral-600 text-neutral-900 dark:text-neutral-100 outline-none"
                      />
                      <button
                        type="submit"
                        aria-label="Save"
                        className="p-1 hover:text-emerald-500 text-neutral-400"
                      >
                        <Check className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={cancelRename}
                        aria-label="Cancel"
                        className="p-1 hover:text-red-500 text-neutral-400"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </form>
                  ) : (
                    <span className="truncate">{conv.title}</span>
                  )}
                </div>

                {/* Edit & Delete Actions */}
                {!isEditing && (
                  <div className="hidden group-hover:flex items-center gap-1 flex-shrink-0">
                    <button
                      onClick={(e) => startRename(conv, e)}
                      aria-label="Rename"
                      title="Rename"
                      className="p-1 rounded text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 hover:bg-neutral-300/60 dark:hover:bg-neutral-700/60 transition-colors"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={(e) => handleDelete(conv.id, e)}
                      aria-label="Delete"
                      title="Delete"
                      className="p-1 rounded text-neutral-400 hover:text-red-500 hover:bg-neutral-300/60 dark:hover:bg-neutral-700/60 transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Confirmation Dialog for Clear All */}
      {showClearConfirm && (
        <div className="p-3 mx-2.5 mb-2 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/60 text-xs">
          <div className="flex items-center gap-1.5 text-red-700 dark:text-red-400 font-medium mb-1">
            <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0" />
            <span>Clear conversations?</span>
          </div>
          <p className="text-neutral-600 dark:text-neutral-400 mb-2 leading-relaxed">
            This will permanently remove your saved chat history.
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => {
                onClearAll();
                setShowClearConfirm(false);
              }}
              className="px-2.5 py-1 rounded-lg bg-red-600 text-white font-medium hover:bg-red-700 text-xs"
            >
              Confirm
            </button>
            <button
              onClick={() => setShowClearConfirm(false)}
              className="px-2.5 py-1 rounded-lg bg-neutral-200 dark:bg-neutral-700 text-neutral-700 dark:text-neutral-200 font-medium text-xs"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Minimal Footer */}
      {conversations.length > 0 && !showClearConfirm && (
        <div className="p-2 border-t border-neutral-200/70 dark:border-neutral-800/80">
          <button
            onClick={() => setShowClearConfirm(true)}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs text-neutral-500 dark:text-neutral-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-neutral-200/50 dark:hover:bg-neutral-800/50 transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Clear all conversations</span>
          </button>
        </div>
      )}
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <aside
        className={`hidden md:block h-screen transition-all duration-300 z-20 flex-shrink-0 ${
          isOpen ? 'w-64' : 'w-0 overflow-hidden border-none'
        }`}
      >
        <div className="w-64 h-full">{content}</div>
      </aside>

      {/* Collapsed Sidebar Restore Button */}
      {!isOpen && (
        <button
          onClick={onToggleDesktop}
          title="Open sidebar"
          aria-label="Open sidebar"
          className="hidden md:flex fixed top-3 left-3 z-30 p-2 rounded-xl bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 shadow-xs text-neutral-600 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-neutral-100 min-w-[36px] min-h-[36px] items-center justify-center"
        >
          <PanelLeft className="w-4 h-4" />
        </button>
      )}

      {/* Mobile Backdrop */}
      {isMobileOpen && (
        <div
          onClick={onCloseMobile}
          className="md:hidden fixed inset-0 z-40 bg-neutral-950/40 backdrop-blur-xs transition-opacity"
        />
      )}

      {/* Mobile Drawer */}
      <div
        className={`md:hidden fixed inset-y-0 left-0 z-50 w-72 bg-white dark:bg-neutral-900 shadow-2xl transform transition-transform duration-300 ease-in-out ${
          isMobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {content}
      </div>
    </>
  );
};

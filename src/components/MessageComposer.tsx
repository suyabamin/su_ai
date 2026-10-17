import React, { useState, useRef, useEffect } from 'react';
import { ArrowUp, Square } from 'lucide-react';

interface MessageComposerProps {
  onSendMessage: (message: string) => void;
  isLoading: boolean;
  onStop: () => void;
}

export const MessageComposer: React.FC<MessageComposerProps> = ({
  onSendMessage,
  isLoading,
  onStop,
}) => {
  const [input, setInput] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-resize textarea based on input content
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      const scrollHeight = textareaRef.current.scrollHeight;
      const maxHeight = 180; // max reasonable height
      textareaRef.current.style.height = `${Math.min(scrollHeight, maxHeight)}px`;
    }
  }, [input]);

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (isLoading) {
      onStop();
      return;
    }
    if (!input.trim()) return;

    onSendMessage(input);
    setInput('');
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const isBlank = !input.trim();

  return (
    <div className="w-full max-w-3xl mx-auto px-4 md:px-6 pb-4 pt-1">
      <form
        onSubmit={handleSubmit}
        className="relative flex items-end bg-neutral-100/90 dark:bg-neutral-800/80 rounded-3xl border border-neutral-200/80 dark:border-neutral-700/60 focus-within:border-neutral-400 dark:focus-within:border-neutral-500 focus-within:bg-white dark:focus-within:bg-neutral-800 transition-all shadow-2xs"
      >
        <textarea
          ref={textareaRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Message SuAI..."
          rows={1}
          className="flex-1 py-3.5 pl-4 pr-12 rounded-3xl bg-transparent resize-none outline-none text-neutral-900 dark:text-neutral-100 placeholder-neutral-400 text-sm md:text-base leading-relaxed overflow-y-auto"
          style={{ minHeight: '48px', maxHeight: '180px' }}
        />

        {/* Action Button: Send or Stop */}
        <div className="absolute right-2 bottom-2">
          {isLoading ? (
            <button
              type="button"
              onClick={onStop}
              title="Stop generation"
              aria-label="Stop generation"
              className="w-8 h-8 rounded-full flex items-center justify-center bg-neutral-900 dark:bg-neutral-100 text-white dark:text-neutral-900 hover:opacity-85 transition-opacity min-w-[36px] min-h-[36px]"
            >
              <Square className="w-3.5 h-3.5 fill-current" />
            </button>
          ) : (
            <button
              type="submit"
              disabled={isBlank}
              aria-label="Send message"
              className={`w-8 h-8 rounded-full flex items-center justify-center transition-all min-w-[36px] min-h-[36px] ${
                isBlank
                  ? 'bg-neutral-200 dark:bg-neutral-700 text-neutral-400 cursor-not-allowed'
                  : 'bg-neutral-900 dark:bg-neutral-100 text-white dark:text-neutral-900 hover:opacity-90 shadow-2xs'
              }`}
            >
              <ArrowUp className="w-4 h-4 stroke-[2.5]" />
            </button>
          )}
        </div>
      </form>
    </div>
  );
};

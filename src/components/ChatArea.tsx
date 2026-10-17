import React, { useEffect, useRef } from 'react';
import type { Message } from '../types/chat';
import { MessageBubble } from './MessageBubble';
import { Code2, Calculator, Languages, Bug, AlertCircle, RotateCcw } from 'lucide-react';
import { SuAILogo } from './SuAILogo';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { CodeBlock } from './CodeBlock';

interface ChatAreaProps {
  messages: Message[];
  isLoading: boolean;
  streamingMessage: string | null;
  error: string | null;
  onSelectPrompt: (prompt: string) => void;
  onRetry: () => void;
}

const EXAMPLE_PROMPTS = [
  {
    icon: Code2,
    title: 'Explain a programming concept',
    desc: 'How does async/await work under the hood in JavaScript?',
    prompt: 'Explain how async/await works under the hood in JavaScript, with clear examples.',
  },
  {
    icon: Calculator,
    title: 'Help me solve a math problem',
    desc: 'Step-by-step solution for quadratic equations',
    prompt: 'Can you show me step-by-step how to solve the quadratic equation 2x² - 8x + 6 = 0?',
  },
  {
    icon: Languages,
    title: 'Explain a difficult topic in simple Bengali',
    desc: 'কোয়ান্টাম কম্পিউটিং সহজ বাংলায় বুঝিয়ে বলো',
    prompt: 'কোয়ান্টাম কম্পিউটিং কী এবং এটি কীভাবে কাজ করে তা সহজ বাংলায় সুন্দরভাবে বুঝিয়ে বলো।',
  },
  {
    icon: Bug,
    title: 'Help me debug my code',
    desc: 'Troubleshoot React state updates & lifecycle',
    prompt: 'I am getting stale state inside my React useEffect callback. How do I fix this properly?',
  },
];

export const ChatArea: React.FC<ChatAreaProps> = ({
  messages,
  isLoading,
  streamingMessage,
  error,
  onSelectPrompt,
  onRetry,
}) => {
  const scrollEndRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to latest message during streaming and updates
  useEffect(() => {
    scrollEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, streamingMessage, isLoading, error]);

  const isEmpty = messages.length === 0 && !streamingMessage;

  if (isEmpty) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-4 sm:p-6 md:p-10 max-w-3xl mx-auto w-full text-center select-none overflow-y-auto">
        {/* SuAI Brand Mark */}
        <div className="w-12 h-12 rounded-2xl bg-neutral-100 dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 flex items-center justify-center mb-4 border border-neutral-200/80 dark:border-neutral-700/80 shadow-xs">
          <SuAILogo size={26} />
        </div>

        <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-neutral-900 dark:text-neutral-100 mb-2">
          How can I help you today?
        </h1>
        <p className="text-neutral-500 dark:text-neutral-400 max-w-md mb-8 text-sm sm:text-base leading-relaxed">
          Ask questions, write and debug code, solve complex logic, or converse naturally in Bengali and English.
        </p>

        {/* 4 Clickable Example Prompt Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full max-w-xl text-left">
          {EXAMPLE_PROMPTS.map((item, idx) => {
            const Icon = item.icon;
            return (
              <button
                key={idx}
                onClick={() => onSelectPrompt(item.prompt)}
                className="group p-3.5 rounded-xl border border-neutral-200/90 dark:border-neutral-800 bg-white dark:bg-neutral-900 hover:bg-neutral-50/80 dark:hover:bg-neutral-800/60 hover:border-neutral-300 dark:hover:border-neutral-700 transition-all text-left shadow-2xs hover:shadow-xs flex flex-col justify-between min-h-[90px]"
              >
                <div className="flex items-center gap-2 mb-1.5">
                  <div className="p-1 rounded-md text-neutral-500 dark:text-neutral-400 group-hover:text-neutral-900 dark:group-hover:text-neutral-100 transition-colors">
                    <Icon className="w-4 h-4" />
                  </div>
                  <span className="font-medium text-neutral-800 dark:text-neutral-200 text-xs sm:text-sm">
                    {item.title}
                  </span>
                </div>
                <p className="text-xs text-neutral-500 dark:text-neutral-400 line-clamp-2 leading-relaxed pl-1">
                  {item.desc}
                </p>
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className="flex-1 overflow-y-auto px-4 md:px-6 py-6 w-full max-w-3xl mx-auto"
    >
      {messages.map((message) => (
        <MessageBubble key={message.id} message={message} />
      ))}

      {/* Active Streaming Message or Thinking Indicator */}
      {isLoading && (
        <div className="flex justify-start mb-6">
          <div className="flex items-start w-full gap-3 md:gap-3.5">
            <div className="flex-shrink-0 w-7 h-7 rounded-lg bg-neutral-100 dark:bg-neutral-800 text-neutral-800 dark:text-neutral-200 flex items-center justify-center border border-neutral-200/80 dark:border-neutral-700/80 mt-0.5">
              <SuAILogo size={16} />
            </div>

            <div className="flex-1 min-w-0 text-neutral-800 dark:text-neutral-100">
              {streamingMessage ? (
                <div className="prose dark:prose-invert max-w-none text-sm md:text-base leading-relaxed break-words overflow-hidden">
                  <ReactMarkdown
                    remarkPlugins={[remarkGfm]}
                    components={{
                      code({ inline, className, children, ...props }: any) {
                        const match = /language-(\w+)/.exec(className || '');
                        const codeText = String(children).replace(/\n$/, '');

                        if (!inline && (match || codeText.includes('\n'))) {
                          return (
                            <CodeBlock
                              language={match ? match[1] : ''}
                              value={codeText}
                            />
                          );
                        }

                        return (
                          <code
                            className="px-1.5 py-0.5 rounded bg-neutral-100 dark:bg-neutral-800 text-neutral-800 dark:text-neutral-200 font-mono text-[13px] border border-neutral-200/60 dark:border-neutral-700/60 font-normal"
                            {...props}
                          >
                            {children}
                          </code>
                        );
                      },
                      p({ children }) {
                        return <p className="mb-3.5 last:mb-0 leading-relaxed">{children}</p>;
                      },
                    }}
                  >
                    {streamingMessage}
                  </ReactMarkdown>
                  {/* Subtle streaming blinking cursor */}
                  <span className="inline-block w-1.5 h-4 ml-1 bg-neutral-600 dark:bg-neutral-400 animate-pulse align-middle" />
                </div>
              ) : (
                /* Subtle Thinking State */
                <div className="flex items-center gap-1.5 py-1 text-xs text-neutral-400">
                  <span className="w-1.5 h-1.5 rounded-full bg-neutral-400 dark:bg-neutral-500 animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="w-1.5 h-1.5 rounded-full bg-neutral-400 dark:bg-neutral-500 animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="w-1.5 h-1.5 rounded-full bg-neutral-400 dark:bg-neutral-500 animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Error Message with Retry */}
      {error && (
        <div className="mb-6 p-3.5 rounded-xl bg-red-50/80 dark:bg-red-950/30 border border-red-200 dark:border-red-900/40 flex items-center justify-between gap-3 text-xs sm:text-sm text-red-700 dark:text-red-300">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0 text-red-500" />
            <span>{error}</span>
          </div>
          <button
            onClick={onRetry}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-red-100 dark:bg-red-900/50 hover:bg-red-200 dark:hover:bg-red-800 text-red-800 dark:text-red-200 font-medium transition-colors text-xs flex-shrink-0 min-h-[32px]"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Retry</span>
          </button>
        </div>
      )}

      <div ref={scrollEndRef} />
    </div>
  );
};

import React, { useState, memo } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Copy, Check } from 'lucide-react';
import type { Message } from '../types/chat';
import { CodeBlock } from './CodeBlock';
import { SuAILogo } from './SuAILogo';

interface MessageBubbleProps {
  message: Message;
}

export const MessageBubble: React.FC<MessageBubbleProps> = memo(({ message }) => {
  const [copied, setCopied] = useState(false);
  const isUser = message.role === 'user';

  const handleCopyMessage = async () => {
    try {
      await navigator.clipboard.writeText(message.content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy response:', err);
    }
  };

  if (isUser) {
    return (
      <div className="flex justify-end mb-5 group">
        <div className="max-w-[85%] md:max-w-[70%]">
          <div className="px-4 py-2.5 rounded-2xl rounded-tr-sm bg-neutral-100 dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 text-sm md:text-base leading-relaxed whitespace-pre-wrap break-words border border-neutral-200/60 dark:border-neutral-700/50 shadow-xs">
            {message.content}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex justify-start mb-6 group">
      <div className="flex items-start w-full gap-3 md:gap-3.5">
        {/* Subtle SuAI Identity Mark */}
        <div className="flex-shrink-0 w-7 h-7 rounded-lg bg-neutral-100 dark:bg-neutral-800 text-neutral-800 dark:text-neutral-200 flex items-center justify-center border border-neutral-200/80 dark:border-neutral-700/80 mt-0.5">
          <SuAILogo size={16} />
        </div>

        <div className="flex-1 min-w-0 text-neutral-800 dark:text-neutral-100">
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
                ul({ children }) {
                  return <ul className="list-disc pl-5 mb-3.5 space-y-1">{children}</ul>;
                },
                ol({ children }) {
                  return <ol className="list-decimal pl-5 mb-3.5 space-y-1">{children}</ol>;
                },
                li({ children }) {
                  return <li className="leading-relaxed">{children}</li>;
                },
                h1({ children }) {
                  return <h1 className="text-xl md:text-2xl font-semibold mt-4 mb-2 text-neutral-900 dark:text-neutral-50">{children}</h1>;
                },
                h2({ children }) {
                  return <h2 className="text-lg md:text-xl font-semibold mt-3.5 mb-2 text-neutral-900 dark:text-neutral-50">{children}</h2>;
                },
                h3({ children }) {
                  return <h3 className="text-base md:text-lg font-medium mt-3 mb-1 text-neutral-900 dark:text-neutral-50">{children}</h3>;
                },
                a({ href, children }) {
                  return (
                    <a
                      href={href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 dark:text-blue-400 underline underline-offset-2 hover:opacity-80 font-medium"
                    >
                      {children}
                    </a>
                  );
                },
                table({ children }) {
                  return (
                    <div className="my-4 overflow-x-auto rounded-lg border border-neutral-200 dark:border-neutral-800">
                      <table className="w-full text-left text-xs md:text-sm divide-y divide-neutral-200 dark:divide-neutral-800">
                        {children}
                      </table>
                    </div>
                  );
                },
                th({ children }) {
                  return (
                    <th className="px-3.5 py-2 font-medium bg-neutral-100/70 dark:bg-neutral-800/60 text-neutral-900 dark:text-neutral-100">
                      {children}
                    </th>
                  );
                },
                td({ children }) {
                  return <td className="px-3.5 py-2 border-t border-neutral-100 dark:border-neutral-800/60">{children}</td>;
                },
                blockquote({ children }) {
                  return (
                    <blockquote className="border-l-2 border-neutral-300 dark:border-neutral-700 pl-3.5 py-0.5 my-2.5 text-neutral-600 dark:text-neutral-400 italic">
                      {children}
                    </blockquote>
                  );
                },
              }}
            >
              {message.content}
            </ReactMarkdown>
          </div>

          {/* Minimalist Action Bar */}
          <div className="flex items-center gap-2 mt-2 pt-1 text-xs text-neutral-400">
            <button
              onClick={handleCopyMessage}
              aria-label="Copy response"
              className="flex items-center gap-1.5 px-2 py-1 rounded text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-500" />
                  <span className="text-emerald-500 font-medium text-xs">Copied</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span className="text-xs">Copy</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
});

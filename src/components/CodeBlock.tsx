import React, { useState, useEffect, useRef } from 'react';
import Prism from 'prismjs';
import 'prismjs/components/prism-javascript';
import 'prismjs/components/prism-typescript';
import 'prismjs/components/prism-python';
import 'prismjs/components/prism-bash';
import 'prismjs/components/prism-json';
import 'prismjs/components/prism-markdown';
import 'prismjs/components/prism-css';
import 'prismjs/components/prism-markup';
import { Check, Copy } from 'lucide-react';

interface CodeBlockProps {
  language: string;
  value: string;
}

export const CodeBlock: React.FC<CodeBlockProps> = ({ language, value }) => {
  const [copied, setCopied] = useState(false);
  const codeRef = useRef<HTMLElement>(null);

  useEffect(() => {
    if (codeRef.current) {
      Prism.highlightElement(codeRef.current);
    }
  }, [value, language]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy code to clipboard:', err);
    }
  };

  const displayLanguage = language || 'code';
  const prismLang = Prism.languages[language] ? language : 'javascript';

  return (
    <div className="my-4 rounded-xl overflow-hidden border border-neutral-700/70 dark:border-neutral-800 bg-[#0d1117] shadow-sm max-w-full">
      <div className="flex items-center justify-between px-3.5 py-1.5 bg-[#161b22] border-b border-neutral-800 text-xs font-mono text-neutral-400">
        <span className="font-medium lowercase tracking-wide text-neutral-300">{displayLanguage}</span>
        <button
          onClick={handleCopy}
          aria-label="Copy code to clipboard"
          className="flex items-center gap-1.5 px-2 py-1 rounded text-neutral-400 hover:text-neutral-100 hover:bg-neutral-800/80 transition-colors min-h-[32px]"
        >
          {copied ? (
            <>
              <Check className="w-3.5 h-3.5 text-emerald-400" />
              <span className="text-emerald-400 text-xs font-medium">Copied</span>
            </>
          ) : (
            <>
              <Copy className="w-3.5 h-3.5" />
              <span className="text-xs">Copy</span>
            </>
          )}
        </button>
      </div>
      <div className="p-3.5 overflow-x-auto text-[13px] md:text-sm font-mono leading-relaxed">
        <pre className="!m-0 !p-0 !bg-transparent">
          <code ref={codeRef} className={`language-${prismLang}`}>
            {value}
          </code>
        </pre>
      </div>
    </div>
  );
};

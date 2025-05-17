"use client";

import React, { useLayoutEffect, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from 'remark-gfm';
import remarkBreaks from 'remark-breaks';
import rehypeHighlight from 'rehype-highlight';

// Speed in ms between characters
const TYPING_SPEED = 20;

function Typewriter({ text, isUserMessage = false }: { text: string; isUserMessage?: boolean }) {
  const [typed, setTyped] = useState("");

  useLayoutEffect(() => {
    let i = 0;
    // Clear typed on re-run
    setTyped("");
    const timer = setInterval(() => {
      i++;
      setTyped(text.slice(0, i));
      if (i >= text.length) {
        clearInterval(timer);
      }
    }, TYPING_SPEED);

    return () => clearInterval(timer);
  }, [text]);

  return (
    <div className="prose prose-sm dark:prose-invert break-words" style={{ maxWidth: '100%' }}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm, remarkBreaks]}
        rehypePlugins={[rehypeHighlight]}
        components={{
          h1: ({ node, ...props }) => <h1 className="text-xl font-bold mt-4 mb-2" {...props} />,
          h2: ({ node, ...props }) => <h2 className="text-lg font-bold mt-3 mb-2" {...props} />,
          h3: ({ node, ...props }) => <h3 className="text-md font-bold mt-3 mb-1" {...props} />,
          h4: ({ node, ...props }) => <h4 className="text-base font-semibold mt-2 mb-1" {...props} />,
          p: ({ children }) => (
            <p className="my-2 leading-relaxed whitespace-pre-line">{children}</p>
          ),
          strong: ({ children }) => (
            <strong className="font-bold">{children}</strong>
          ),
          em: ({ children }) => (
            <em className="italic">{children}</em>
          ),
          blockquote: ({ children }) => (
            <blockquote className={
              isUserMessage 
                ? "border-l-4 border-white/30 pl-3 my-2 italic" 
                : "border-l-4 border-purple-chat/30 pl-3 my-2 italic"
            }>
              {children}
            </blockquote>
          ),
          ul: ({ children }) => (
            <ul className="list-disc pl-6 my-2 space-y-1">{children}</ul>
          ),
          ol: ({ children }) => (
            <ol className="list-decimal pl-6 my-2 space-y-1">{children}</ol>
          ),
          li: ({ children }) => (
            <li className="mb-1">{children}</li>
          ),
          a: ({ href, children }) => (
            <a 
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              className={
                isUserMessage 
                  ? "text-blue-200 underline hover:text-blue-100" 
                  : "text-blue-600 underline hover:text-blue-800"
              }
            >
              {children}
            </a>
          ),
          hr: () => (
            <hr className={
              isUserMessage 
                ? "border-white/20 my-4" 
                : "border-gray-300 my-4"
            } />
          ),
          table: ({ children }) => (
            <div className="overflow-x-auto my-4">
              <table className="min-w-full border-collapse border border-gray-300 rounded-md">
                {children}
              </table>
            </div>
          ),
          thead: ({ children }) => (
            <thead className={
              isUserMessage 
                ? "bg-purple-chat/40" 
                : "bg-purple-chat/20"
            }>
              {children}
            </thead>
          ),
          tbody: ({ children }) => (
            <tbody>
              {children}
            </tbody>
          ),
          tr: ({ children }) => (
            <tr className="border-b border-gray-300">
              {children}
            </tr>
          ),
          th: ({ children }) => (
            <th className="border border-gray-300 px-4 py-2 text-left font-semibold">
              {children}
            </th>
          ),
          td: ({ children }) => (
            <td className="border border-gray-300 px-4 py-2">
              {children}
            </td>
          ),
          code: ({ node, inline, className, children, ...props }: any) =>
            inline ? (
              <code
                className={
                  isUserMessage 
                    ? "bg-purple-chat/30 rounded px-1.5 py-0.5 font-mono text-sm" 
                    : "bg-purple-chat/10 rounded px-1.5 py-0.5 font-mono text-sm"
                }
                {...props}
              >
                {children}
              </code>
            ) : (
              <pre className={
                isUserMessage 
                  ? "bg-purple-chat/30 p-4 rounded-lg my-3 overflow-x-auto font-mono text-sm" 
                  : "bg-purple-chat/10 p-4 rounded-lg my-3 overflow-x-auto font-mono text-sm"
                }
              >
                <code className={`language-${className?.replace('language-', '') || 'plaintext'}`} {...props}>
                  {children}
                </code>
              </pre>
            ),
        }}
      >
        {typed}
      </ReactMarkdown>
    </div>
  );
}

export default Typewriter;
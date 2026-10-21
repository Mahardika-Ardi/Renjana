'use client';

import { memo } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkBreaks from 'remark-breaks';

/**
 * Markdown preview for AI chat bubbles.
 *
 * The counselor answers with Markdown (bold, headings, lists, occasional
 * tables/code), so raw `**`/`#` text is rendered as formatted elements
 * instead. Raw HTML inside model output is ignored by react-markdown by
 * default — nothing is ever injected into the DOM.
 *
 * remark-breaks keeps single newlines as <br> so multi-line replies read
 * like chat instead of collapsing into one paragraph. `memo` on the string
 * prop so composer keystrokes don't re-parse the whole thread.
 *
 * USER messages must NOT go through this — typed text stays literal.
 */
export const ChatMarkdown = memo(function ChatMarkdown({ content }: { content: string }) {
  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm, remarkBreaks]}
      components={{
        p: ({ children }) => <p className="my-1.5 first:mt-0 last:mb-0">{children}</p>,
        strong: ({ children }) => <strong className="font-semibold">{children}</strong>,
        em: ({ children }) => <em className="italic">{children}</em>,
        del: ({ children }) => <del className="text-[#a3a199]">{children}</del>,
        h1: ({ children }) => (
          <h3 className="mt-3 mb-1 text-[15px] font-bold first:mt-0">{children}</h3>
        ),
        h2: ({ children }) => (
          <h4 className="mt-3 mb-1 text-[14.5px] font-bold first:mt-0">{children}</h4>
        ),
        h3: ({ children }) => (
          <h5 className="mt-2.5 mb-1 text-[13.5px] font-bold first:mt-0">{children}</h5>
        ),
        h4: ({ children }) => (
          <h6 className="mt-2.5 mb-1 text-[13px] font-bold first:mt-0">{children}</h6>
        ),
        ul: ({ children }) => (
          <ul className="my-1.5 list-disc space-y-1 pl-5 first:mt-0 last:mb-0">{children}</ul>
        ),
        ol: ({ children }) => (
          <ol className="my-1.5 list-decimal space-y-1 pl-5 first:mt-0 last:mb-0">{children}</ol>
        ),
        li: ({ children }) => (
          <li className="leading-relaxed marker:text-[#8a6335]">{children}</li>
        ),
        code: ({ className, children }) => (
          <code
            className={`rounded-md px-1.5 py-0.5 text-[12.5px] ${className ? '' : 'bg-[#f3efe7] text-[#79582f]'}`}
          >
            {children}
          </code>
        ),
        pre: ({ children }) => (
          <pre className="my-2 overflow-x-auto rounded-xl bg-[#f7f4ee] p-3 text-[12.5px] [&_code]:bg-transparent [&_code]:p-0 [&_code]:text-inherit">
            {children}
          </pre>
        ),
        blockquote: ({ children }) => (
          <blockquote className="my-2 border-l-2 border-[#d9d4c8] pl-3 text-[#7a7871] italic">
            {children}
          </blockquote>
        ),
        a: ({ href, children }) => (
          <a
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            className="font-medium text-[#8a6335] underline underline-offset-2"
          >
            {children}
          </a>
        ),
        hr: () => <hr className="my-3 border-[#e7e4dc]" />,
        img: ({ src, alt }) => (
          // eslint-disable-next-line @next/next/no-img-element -- remote model-provided images, same pattern as avatar surfaces
          <img src={src} alt={alt ?? ''} className="my-1.5 max-w-full rounded-xl" />
        ),
        table: ({ children }) => (
          <div className="my-2 overflow-x-auto">
            <table className="w-full border-collapse text-[13px]">{children}</table>
          </div>
        ),
        th: ({ children }) => (
          <th className="border border-[#e7e4dc] bg-[#f7f4ee] px-2.5 py-1.5 text-left font-semibold">
            {children}
          </th>
        ),
        td: ({ children }) => (
          <td className="border border-[#e7e4dc] px-2.5 py-1.5">{children}</td>
        ),
      }}
    >
      {content}
    </ReactMarkdown>
  );
});

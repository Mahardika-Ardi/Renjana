'use client';

import dynamic from 'next/dynamic';
import type { ForwardRefExoticComponent } from 'react';
import type { MDXEditorMethods, MDXEditorProps } from '@mdxeditor/editor';
import { useSelectionBubble } from '@/hooks/use-selection-bubble';

const Editor = dynamic(() => import('./initialized-mdx-editor'), {
  ssr: false,
  loading: () => (
    <div
      aria-hidden
      className="min-h-105 animate-pulse rounded-2xl bg-[#f5efe6]"
    />
  ),
}) as ForwardRefExoticComponent<
  Omit<MDXEditorProps, 'plugins'> & React.RefAttributes<MDXEditorMethods>
>;

export interface MarkdownEditorProps {
  markdown: string;
  onChange: (markdown: string) => void;
  placeholder?: string;
  readOnly?: boolean;
}

/**
 * Reusable WYSIWYG Markdown editor.
 *
 * - PC (`hover` + fine pointer + `lg`): the toolbar floats as a popup
 *   above the text selection (Word-style) and stays hidden otherwise.
 * - Phone/tablet: a floating bottom-dock toolbar is shown instead.
 *
 * The Markdown string stays the source of truth — edits are serialized
 * back to Markdown and forwarded through `onChange`.
 */
export default function MarkdownEditor({
  markdown,
  onChange,
  placeholder = 'Tulis apapun yang Anda rasakan…',
  readOnly = false,
}: MarkdownEditorProps) {
  const { containerRef, isDesktop } = useSelectionBubble();

  return (
    <div
      ref={containerRef}
      className={`renjana-mdx ${isDesktop ? 'is-bubble' : 'is-static'}`}
    >
      <Editor
        markdown={markdown}
        onChange={(value: string, initialNormalize: boolean) => {
          // Skip the parser's initial normalization echo so opening a
          // journal never triggers an autosave without user edits.
          if (!initialNormalize) onChange(value);
        }}
        placeholder={placeholder}
        readOnly={readOnly}
        contentEditableClassName="renjana-prose"
      />
    </div>
  );
}

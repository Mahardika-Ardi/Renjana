'use client';

import dynamic from 'next/dynamic';
import { useEffect, useRef, useState, type ForwardRefExoticComponent } from 'react';
import type { MDXEditorMethods, MDXEditorProps } from '@mdxeditor/editor';

const Editor = dynamic(
  () => import('./initialized-mdx-editor'),
  {
    ssr: false,
    loading: () => (
      <div
        aria-hidden
        className="min-h-[420px] animate-pulse rounded-2xl bg-[#f5efe6]"
      />
    ),
  },
) as ForwardRefExoticComponent<
  Omit<MDXEditorProps, 'plugins'> & React.RefAttributes<MDXEditorMethods>
>;

export interface MarkdownEditorProps {
  markdown: string;
  onChange: (markdown: string) => void;
  placeholder?: string;
  readOnly?: boolean;
}

const DESKTOP_BUBBLE_QUERY =
  '(hover: hover) and (pointer: fine) and (min-width: 1024px)';

function useDesktopBubble(): boolean {
  const [isDesktop, setIsDesktop] = useState(false);

  useEffect(() => {
    const query = window.matchMedia(DESKTOP_BUBBLE_QUERY);
    const sync = () => setIsDesktop(query.matches);
    sync();
    query.addEventListener('change', sync);
    return () => query.removeEventListener('change', sync);
  }, []);

  return isDesktop;
}

/**
 * Reusable WYSIWYG Markdown editor.
 *
 * - PC (`hover` + fine pointer + `lg`): the toolbar floats as a popup
 *   above the text selection (Word-style) and stays hidden otherwise.
 * - Phone/tablet: a static sticky toolbar is shown instead.
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
  const isDesktop = useDesktopBubble();
  const containerRef = useRef<HTMLDivElement | null>(null);
  // Timestamp until which re-show is suppressed. Formatting actions
  // (dropdown option, bold, link, …) make Lexical re-select content right
  // after applying — without this the bubble would pop straight back up.
  const suppressUntilRef = useRef(0);

  useEffect(() => {
    if (!isDesktop) return;
    const container = containerRef.current;
    if (!container) return;

    const markToolbarAction = (event: Event) => {
      const target = event.target as HTMLElement | null;
      // Only toolbar chrome (buttons, trigger, option menu, dialogs) —
      // never presses inside editable text, which start fresh selections.
      if (
        target?.closest(
          '.renjana-mdx-toolbar, .mdxeditor-select-content, [role="listbox"], [role="dialog"]',
        )
      ) {
        suppressUntilRef.current = Date.now() + 400;
      }
    };

    const update = () => {
      const toolbar = container.querySelector<HTMLElement>(
        '.renjana-mdx-toolbar',
      );
      if (!toolbar) return;

      // While the block-type menu is open, keep the bubble parked where
      // it is — never hide or jump mid-interaction.
      const menuOpen =
        toolbar.querySelector('[data-state="open"]') !== null ||
        container.querySelector('.mdxeditor-select-content') !== null;
      if (menuOpen) return;

      if (Date.now() < suppressUntilRef.current) return;

      const editable = container.querySelector('[contenteditable="true"]');
      const selection = window.getSelection();
      // The anchor must be inside editable text. Menu/toolbar/dialog
      // selections (Radix portals into the editor root) must never drive
      // the bubble — otherwise option clicks get eaten and the bubble
      // jumps onto the menu.
      const anchorInside =
        !!selection &&
        !!editable &&
        selection.rangeCount > 0 &&
        !selection.isCollapsed &&
        editable.contains(selection.anchorNode) &&
        selection.toString().trim().length > 0;

      if (anchorInside && selection) {
        const rect = selection.getRangeAt(0).getBoundingClientRect();
        // Guard against zero-area rects (e.g. capped selections).
        if (rect.width === 0 && rect.height === 0) {
          container.classList.remove('has-selection');
          return;
        }

        const host = container.getBoundingClientRect();
        const x = Math.min(
          Math.max(rect.left - host.left + rect.width / 2, 140),
          host.width - 140,
        );
        const y = rect.top - host.top;

        toolbar.style.left = `${x}px`;
        toolbar.style.top = `${y}px`;
        container.classList.add('has-selection');
        return;
      }

      // No text selection. Keep the bubble (and its position) while the
      // user interacts with toolbar UI: opening the block-type dropdown,
      // picking an option, or using the link dialog moves focus out of
      // the editor and collapses the DOM selection. Hiding here would
      // orphan the open menu and swallow the click, forcing a second one.
      const active = document.activeElement as HTMLElement | null;
      const focusInEditable =
        !!editable && !!active && editable.contains(active);
      const focusInChrome =
        !!active && container.contains(active) && !focusInEditable;
      if (focusInChrome) return;

      container.classList.remove('has-selection');
      toolbar.style.opacity = '';
      toolbar.style.left = '';
      toolbar.style.top = '';
    };

    const onSelectionChange = () => update();
    document.addEventListener('selectionchange', onSelectionChange);
    // Focus can move into toolbar UI (dropdown trigger, menu option,
    // link dialog) without a selectionchange in some browsers.
    container.addEventListener('focusin', onSelectionChange);
    container.addEventListener('focusout', onSelectionChange);
    // Any press inside the toolbar starts a formatting interaction:
    // suppress the post-apply re-show while Lexical settles.
    container.addEventListener('pointerdown', markToolbarAction, true);
    container.addEventListener('click', markToolbarAction, true);
    window.addEventListener('scroll', update, true);
    window.addEventListener('resize', update);

    return () => {
      document.removeEventListener('selectionchange', onSelectionChange);
      container.removeEventListener('focusin', onSelectionChange);
      container.removeEventListener('focusout', onSelectionChange);
      container.removeEventListener('pointerdown', markToolbarAction, true);
      container.removeEventListener('click', markToolbarAction, true);
      window.removeEventListener('scroll', update, true);
      window.removeEventListener('resize', update);
    };
  }, [isDesktop]);

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

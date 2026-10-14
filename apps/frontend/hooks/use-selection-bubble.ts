'use client';

import { useEffect, useRef, useState } from 'react';

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

/* PC selection bubble positioning (Word-style floating toolbar).
 *
 * Tracks the DOM selection and parks `.renjana-mdx-toolbar` above it.
 * Selections inside toolbar chrome (dropdown trigger, option menu, link
 * dialog — Radix portals into the editor root) never drive the bubble,
 * and a short suppression window after any toolbar press absorbs the
 * re-select Lexical performs post-format, so the bubble stays dismissed.
 */
export function useSelectionBubble() {
  const isDesktop = useDesktopBubble();
  const containerRef = useRef<HTMLDivElement | null>(null);
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

  return { containerRef, isDesktop };
}

'use client';

import { forwardRef } from 'react';
import {
  BlockTypeSelect,
  BoldItalicUnderlineToggles,
  CreateLink,
  InsertCodeBlock,
  InsertThematicBreak,
  ListsToggle,
  MDXEditor,
  Separator,
  StrikeThroughSupSubToggles,
  UndoRedo,
  codeBlockPlugin,
  headingsPlugin,
  linkDialogPlugin,
  linkPlugin,
  listsPlugin,
  markdownShortcutPlugin,
  quotePlugin,
  thematicBreakPlugin,
  toolbarPlugin,
  type MDXEditorMethods,
  type MDXEditorProps,
} from '@mdxeditor/editor';

interface InitializedMDXEditorProps extends Omit<MDXEditorProps, 'plugins'> {
  editorRef?: React.ForwardedRef<MDXEditorMethods> | null;
}

/**
 * Client-only MDXEditor with plugins initialized in the browser.
 * Never import this file directly in a Server Component — use
 * `markdown-editor.tsx` (dynamic `ssr: false`) instead.
 */
function InitializedMDXEditor({
  editorRef,
  ...props
}: InitializedMDXEditorProps) {
  return (
    <MDXEditor
      ref={editorRef}
      plugins={[
        headingsPlugin({ allowedHeadingLevels: [1, 2, 3] }),
        listsPlugin(),
        quotePlugin(),
        thematicBreakPlugin(),
        linkPlugin(),
        linkDialogPlugin(),
        codeBlockPlugin({ defaultCodeBlockLanguage: 'txt' }),
        markdownShortcutPlugin(),
        toolbarPlugin({
          toolbarClassName: 'renjana-mdx-toolbar',
          toolbarContents: () => (
            <>
              <span className="renjana-only-static">
                <UndoRedo />
              </span>
              <span className="renjana-only-static">
                <Separator />
              </span>
              <BlockTypeSelect />
              <Separator />
              <BoldItalicUnderlineToggles options={['Bold', 'Italic']} />
              <StrikeThroughSupSubToggles />
              <Separator />
              <ListsToggle />
              <CreateLink />
              <span className="renjana-only-static">
                <InsertCodeBlock />
                <InsertThematicBreak />
              </span>
            </>
          ),
        }),
      ]}
      {...props}
    />
  );
}

const ForwardedInitializedMDXEditor = forwardRef<
  MDXEditorMethods,
  Omit<InitializedMDXEditorProps, 'editorRef'>
>((props, ref) => <InitializedMDXEditor {...props} editorRef={ref} />);

ForwardedInitializedMDXEditor.displayName = 'InitializedMDXEditor';

export default ForwardedInitializedMDXEditor;

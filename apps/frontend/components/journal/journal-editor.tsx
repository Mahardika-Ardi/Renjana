'use client';

import { useMemo } from 'react';
import { Calendar, Clock } from 'lucide-react';
import { JournalResponse } from '@renjana/types';
import { formatEditedAt, formatFullDate } from '@renjana/utils';
import {
  composeContent,
  splitBody,
  splitTitleLine,
} from '@/lib/journal-content';
import { PAPER_SHADOW, UNTITLED } from '@/lib/constants/journal';
import TagEditor, { tagToneClass } from './tag-editor';
import MarkdownEditor from './markdown-editor';

interface JournalEditorProps {
  entry: JournalResponse | null;
  content: string;
  tags: string[];
  detailLoading: boolean;
  /** Partner entry — static title/tags, no editing surface. */
  readOnly?: boolean;
  /** "Ditulis oleh …" identity for partner entries. */
  author?: { name: string; avatarUrl: string | null } | null;
  onContentChange: (value: string) => void;
  onTagsChange: (tags: string[]) => void;
}

export default function JournalEditor({
  entry,
  content,
  tags,
  detailLoading,
  readOnly = false,
  author = null,
  onContentChange,
  onTagsChange,
}: JournalEditorProps) {
  const titleLine = useMemo(() => splitTitleLine(content), [content]);
  const body = useMemo(() => splitBody(content), [content]);

  if (!entry) {
    return (
      <div className="mx-auto w-full max-w-3xl">
        <article
          className={`relative flex min-h-[60vh] items-center justify-center rounded-3xl border border-[#ede3da] bg-white p-6 sm:p-12 md:min-h-[820px] md:p-14 ${PAPER_SHADOW}`}
        >
          <p className="text-center font-serif text-lg text-[#8c7e75]">
            {detailLoading ? 'Memuat jurnal…' : 'Belum ada jurnal. Buat catatan baru untuk mulai menulis.'}
          </p>
        </article>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-3xl">
      <article
        id="journal-article"
        className={`relative min-h-[820px] rounded-3xl border border-[#ede3da] bg-white p-5 sm:p-8 md:p-14 ${PAPER_SHADOW}`}
      >
        <header className="mb-5 border-b border-[#f1e6de] pb-4">
          {readOnly ? (
            <h1 className="mb-2 font-serif text-2xl font-medium tracking-tight text-[#2c2523] sm:text-3xl md:text-4xl">
              {titleLine || UNTITLED}
            </h1>
          ) : (
            <input
              value={titleLine}
              onChange={(event) =>
                onContentChange(composeContent(event.target.value, body))
              }
              placeholder={UNTITLED}
              aria-label="Judul jurnal"
              autoComplete="off"
              className="mb-2 w-full border-b-2 border-transparent bg-transparent font-serif text-2xl font-medium tracking-tight text-[#2c2523] outline-none transition-colors placeholder:text-[#c3b3a6] focus:border-[#c96f4a] sm:text-3xl md:text-4xl"
            />
          )}
          {readOnly ? (
            tags.length > 0 && (
              <div className="flex flex-wrap items-center gap-2 pt-1">
                {tags.map((tag, index) => (
                  <span
                    key={tag}
                    className={`rounded-full px-2.5 py-0.5 text-[11px] font-medium ${tagToneClass(index)}`}
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            )
          ) : (
            <TagEditor tags={tags} onChange={onTagsChange} />
          )}
          <div className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-[#8c7e75]">
            {author && (
              <>
                <span className="flex items-center gap-1.5">
                  {author.avatarUrl ? (
                    /* eslint-disable-next-line @next/next/no-img-element --
                     * remote avatar URL, same pattern as other surfaces */
                    <img
                      src={author.avatarUrl}
                      alt=""
                      className="h-4 w-4 rounded-full object-cover"
                    />
                  ) : (
                    <span className="grid h-4 w-4 place-items-center rounded-full bg-[#c96f4a] text-[8px] font-bold text-white">
                      {author.name.slice(0, 1).toUpperCase()}
                    </span>
                  )}
                  <span>
                    Ditulis oleh{' '}
                    <span className="font-medium text-[#665c54]">
                      {author.name}
                    </span>
                  </span>
                </span>
                <span aria-hidden className="hidden sm:inline">
                  •
                </span>
              </>
            )}
            <span className="flex items-center gap-1">
              <Calendar className="h-3.5 w-3.5" aria-hidden />
              <span>
                Dibuat:{' '}
                <time dateTime={entry.entryDate} className="font-medium text-[#665c54]">
                  {formatFullDate(entry.entryDate)}
                </time>
              </span>
            </span>
            {!readOnly && (
              <>
                <span aria-hidden className="hidden sm:inline">•</span>
                <span className="flex items-center gap-1">
                  <Clock className="h-3.5 w-3.5" aria-hidden />
                  <span>
                    Terakhir disunting:{' '}
                    <span className="font-medium text-[#665c54]">
                      {formatEditedAt(entry.updatedAt)}
                    </span>
                  </span>
                </span>
              </>
            )}
          </div>
        </header>

        <MarkdownEditor
          key={entry.id}
          markdown={body}
          onChange={(nextBody) =>
            onContentChange(composeContent(titleLine, nextBody))
          }
          placeholder="Tulis apapun yang Anda rasakan…"
          readOnly={readOnly}
        />
      </article>
    </div>
  );
}

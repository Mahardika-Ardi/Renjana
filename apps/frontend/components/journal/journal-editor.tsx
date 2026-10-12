'use client';

import { useMemo } from 'react';
import { Calendar, Clock } from 'lucide-react';
import { JournalResponse } from '@renjana/types';
import { formatEditedAt, formatFullDate } from '@renjana/utils';
import { PAPER_SHADOW, UNTITLED } from '@/lib/constants/journal';
import TagEditor from './tag-editor';
import MarkdownEditor from './markdown-editor';

interface JournalEditorProps {
  entry: JournalResponse | null;
  content: string;
  tags: string[];
  detailLoading: boolean;
  onContentChange: (value: string) => void;
  onTagsChange: (tags: string[]) => void;
}

function splitTitleLine(content: string): string {
  const normalized = (content ?? '').replace(/\r\n/g, '\n');
  const lineBreak = normalized.indexOf('\n');
  const raw = lineBreak === -1 ? normalized : normalized.slice(0, lineBreak);
  // Strip only the `#` marker itself — never trim. Trimming here would
  // swallow every space the user types on its way back into the input.
  return raw.replace(/^#+\s?/, '');
}

function splitBody(content: string): string {
  const normalized = (content ?? '').replace(/\r\n/g, '\n');
  const lineBreak = normalized.indexOf('\n');
  if (lineBreak === -1) return '';
  return normalized.slice(lineBreak + 1).replace(/^\n+/, '');
}

function composeContent(title: string, body: string): string {
  // A blank title keeps its (empty) first-line slot so the body's first
  // line is never promoted into the title on the next split.
  if (!title.trim()) return body ? `\n${body}` : '';
  if (!body) return `# ${title}\n`;
  return `# ${title}\n\n${body}`;
}

export default function JournalEditor({
  entry,
  content,
  tags,
  detailLoading,
  onContentChange,
  onTagsChange,
}: JournalEditorProps) {
  const titleLine = useMemo(() => splitTitleLine(content), [content]);
  const body = useMemo(() => splitBody(content), [content]);

  if (!entry) {
    return (
      <div className="mx-auto w-full max-w-3xl">
        <article
          className={`relative flex min-h-[820px] items-center justify-center rounded-3xl border border-[#ede3da] bg-white p-8 sm:p-12 md:p-14 ${PAPER_SHADOW}`}
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
        className={`relative min-h-[820px] rounded-3xl border border-[#ede3da] bg-white p-8 sm:p-12 md:p-14 ${PAPER_SHADOW}`}
      >
        <header className="mb-5 border-b border-[#f1e6de] pb-4">
          <input
            value={titleLine}
            onChange={(event) =>
              onContentChange(composeContent(event.target.value, body))
            }
            placeholder={UNTITLED}
            aria-label="Judul jurnal"
            autoComplete="off"
            className="mb-2 w-full bg-transparent font-serif text-3xl font-medium tracking-tight text-[#2c2523] outline-none transition placeholder:text-[#c3b3a6] focus:border-b-2 focus:border-[#c96f4a] sm:text-4xl"
          />
          <TagEditor tags={tags} onChange={onTagsChange} />
          <div className="mt-2 flex items-center space-x-2 text-xs text-[#8c7e75]">
            <span className="flex items-center gap-1">
              <Calendar className="h-3.5 w-3.5" aria-hidden />
              <span>
                Dibuat:{' '}
                <time dateTime={entry.entryDate} className="font-medium text-[#665c54]">
                  {formatFullDate(entry.entryDate)}
                </time>
              </span>
            </span>
            <span aria-hidden>•</span>
            <span className="flex items-center gap-1">
              <Clock className="h-3.5 w-3.5" aria-hidden />
              <span>
                Terakhir disunting:{' '}
                <span className="font-medium text-[#665c54]">
                  {formatEditedAt(entry.updatedAt)}
                </span>
              </span>
            </span>
          </div>
        </header>

        <MarkdownEditor
          key={entry.id}
          markdown={body}
          onChange={(nextBody) =>
            onContentChange(composeContent(titleLine, nextBody))
          }
          placeholder="Tulis apapun yang Anda rasakan…"
        />
      </article>
    </div>
  );
}

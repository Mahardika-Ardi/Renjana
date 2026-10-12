'use client';

import { useMemo, useRef } from 'react';
import { Calendar, Clock } from 'lucide-react';
import { JournalResponse } from '@renjana/types';
import { formatEditedAt, formatFullDate } from '@renjana/utils';
import { PAPER_SHADOW, UNTITLED } from '@/lib/constants/journal';
import TagEditor from './tag-editor';
import FormatToolbar from './format-toolbar';

interface JournalEditorProps {
  entry: JournalResponse | null;
  content: string;
  tags: string[];
  detailLoading: boolean;
  onContentChange: (value: string) => void;
  onTagsChange: (tags: string[]) => void;
}

function splitTitle(content: string): string {
  const normalized = (content ?? '').replace(/\r\n/g, '\n');
  const lineBreak = normalized.indexOf('\n');
  const raw = lineBreak === -1 ? normalized : normalized.slice(0, lineBreak);
  return raw.replace(/^#+\s*/, '').trim() || UNTITLED;
}

export default function JournalEditor({
  entry,
  content,
  tags,
  detailLoading,
  onContentChange,
  onTagsChange,
}: JournalEditorProps) {
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  const title = useMemo(() => splitTitle(content), [content]);

  const applyWrap = (prefix: string, suffix: string) => {
    const el = textareaRef.current;
    if (!el) {
      onContentChange(`${prefix}${content}${suffix}`);
      return;
    }
    const start = el.selectionStart ?? content.length;
    const end = el.selectionEnd ?? content.length;
    const before = content.slice(0, start);
    const selected = content.slice(start, end) || 'teks';
    const after = content.slice(end);
    const next = `${before}${prefix}${selected}${suffix}${after}`;
    onContentChange(next);
    requestAnimationFrame(() => {
      el.focus();
      const cursor = start + prefix.length + selected.length + suffix.length;
      el.setSelectionRange(cursor, cursor);
    });
  };

  const applyPrefixLine = (prefix: string) => {
    const el = textareaRef.current;
    if (!el) {
      onContentChange(
        content
          .split('\n')
          .map((line) => `${prefix}${line}`)
          .join('\n'),
      );
      return;
    }
    const start = el.selectionStart ?? 0;
    const lineStart = content.lastIndexOf('\n', start - 1) + 1;
    const next = `${content.slice(0, lineStart)}${prefix}${content.slice(lineStart)}`;
    onContentChange(next);
    requestAnimationFrame(() => {
      el.focus();
      el.setSelectionRange(start + prefix.length, start + prefix.length);
    });
  };

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
        <header className="mb-8 border-b border-[#f1e6de] pb-6">
          <h1 className="mb-3 font-serif text-3xl font-medium tracking-tight text-[#2c2523] sm:text-4xl">
            {title}
          </h1>
          <TagEditor tags={tags} onChange={onTagsChange} />
          <div className="mt-3 flex items-center space-x-2 text-xs text-[#8c7e75]">
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

        <textarea
          ref={textareaRef}
          value={content}
          onChange={(event) => onContentChange(event.target.value)}
          placeholder="Tulis apapun yang Anda rasakan…"
          aria-label="Isi jurnal"
          rows={22}
          className="w-full resize-y select-text rounded-2xl border border-transparent bg-transparent font-serif text-lg leading-loose text-[#38312d] outline-none transition placeholder:text-[#b3a599] focus:border-[#eedfd5] focus:bg-[#fdfbf9] focus:p-4 sm:text-[1.18rem]"
        />

        <FormatToolbar onWrap={applyWrap} onPrefixLine={applyPrefixLine} />
      </article>
    </div>
  );
}

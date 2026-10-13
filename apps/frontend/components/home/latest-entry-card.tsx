'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { journalApi } from '@/lib/api/journal';
import { JournalResponse } from '@renjana/types';
import { formatShortDate } from '@renjana/utils';

function splitTitle(content: string): string {
  const normalized = (content ?? '').replace(/\r\n/g, '\n');
  const lineBreak = normalized.indexOf('\n');
  const raw = lineBreak === -1 ? normalized : normalized.slice(0, lineBreak);
  return raw.replace(/^#+\s*/, '').trim() || 'Tanpa Judul';
}

function previewOf(content: string): string {
  const normalized = (content ?? '').replace(/\r\n/g, '\n');
  const lineBreak = normalized.indexOf('\n');
  const body =
    lineBreak === -1
      ? normalized
      : normalized.slice(lineBreak + 1).replace(/^\n+/, '');
  const source = body.trim() || normalized.trim();
  return source.replace(/\s+/g, ' ').slice(0, 160);
}

function BookIcon() {
  return (
    <svg
      width="17"
      height="17"
      viewBox="0 0 24 24"
      fill="none"
      stroke="#8b602f"
      strokeWidth="1.8"
    >
      <path d="M5 4h12a2 2 0 0 1 2 2v14H7a2 2 0 0 1-2-2V4Z" />
      <path d="M7 4v14" />
      <path d="M11 8h5M11 11h5" />
    </svg>
  );
}

export default function LatestEntryCard() {
  const [entry, setEntry] = useState<JournalResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let ignore = false;

    const load = async () => {
      try {
        const res = await journalApi.getAll({ page: '1', limit: '1' });
        if (ignore) return;
        const list =
          (res.data as unknown as { items: JournalResponse[] }).items ?? [];
        setEntry(list[0] ?? null);
      } catch {
        if (!ignore) setFailed(true);
      } finally {
        if (!ignore) setLoading(false);
      }
    };

    load();

    return () => {
      ignore = true;
    };
  }, []);

  if (loading) {
    return (
      <article
        aria-busy="true"
        aria-label="Memuat jurnal terbaru"
        className="min-h-72.5 rounded-[30px] bg-[#f0efed] p-7 md:p-8"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white">
              <BookIcon />
            </div>
            <div className="h-5 w-28 animate-pulse rounded-full bg-[#e2ded8] motion-reduce:animate-none" />
          </div>
          <div className="h-4 w-14 animate-pulse rounded-full bg-[#e2ded8] motion-reduce:animate-none" />
        </div>
        <div className="mt-7 space-y-2.5">
          <div className="h-4 w-full animate-pulse rounded-full bg-[#e2ded8] motion-reduce:animate-none" />
          <div className="h-4 w-11/12 animate-pulse rounded-full bg-[#e2ded8] motion-reduce:animate-none" />
          <div className="h-4 w-3/4 animate-pulse rounded-full bg-[#e2ded8] motion-reduce:animate-none" />
        </div>
        <div className="mt-7 flex items-end justify-between border-t border-[#d7d4ce] pt-5">
          <div className="h-6 w-32 animate-pulse rounded-full bg-[#e2ded8] motion-reduce:animate-none" />
          <div className="h-4 w-24 animate-pulse rounded-full bg-[#e2ded8] motion-reduce:animate-none" />
        </div>
      </article>
    );
  }

  if (!entry || failed) {
    return (
      <article className="flex min-h-72.5 flex-col rounded-[30px] bg-[#f0efed] p-7 md:p-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white">
              <BookIcon />
            </div>
            <h3 className="text-xl font-semibold">Latest Entry</h3>
          </div>
        </div>
        <p className="mt-7 flex-1 text-[15px] leading-6 text-[#242420]">
          {failed
            ? 'Tidak dapat memuat jurnal saat ini.'
            : 'Belum ada jurnal. Tulis momen pertamamu hari ini.'}
        </p>
        <div className="mt-7 flex items-end justify-end border-t border-[#d7d4ce] pt-5">
          <Link href="/note/journal">
            <span className="text-xs font-semibold tracking-wide text-[#825a2e]">
              {failed ? 'Coba Lagi →' : 'Mulai Menulis →'}
            </span>
          </Link>
        </div>
      </article>
    );
  }

  const title = splitTitle(entry.content);

  return (
    <article className="min-h-72.5 rounded-[30px] bg-[#f0efed] p-7 md:p-8">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white">
            <BookIcon />
          </div>
          <h3 className="text-xl font-semibold">Latest Entry</h3>
        </div>
        <span className="text-xs font-medium uppercase text-[#575650]">
          Last updated · {formatShortDate(entry.entryDate)}
        </span>
      </div>

      <div className="mt-7">
        <div className="text-4xl leading-none text-[#d9d6cf]">“</div>
        <p className="-mt-1 max-w-127.5 text-[15px] leading-6 text-[#242420]">
          <span className="font-semibold">{title}</span>
          {previewOf(entry.content) && ` — ${previewOf(entry.content)}`}
        </p>
      </div>

      <div className="mt-7 flex items-end justify-between border-t border-[#d7d4ce] pt-5">
        <div className="flex gap-2">
          {entry.tags.length > 0 ? (
            entry.tags.slice(0, 3).map((tag) => (
              <span
                key={tag}
                className="rounded-full bg-white px-3 py-1 text-[10px] text-[#55544e]"
              >
                #{tag}
              </span>
            ))
          ) : (
            <span className="rounded-full bg-white px-3 py-1 text-[10px] text-[#55544e]">
              #journal
            </span>
          )}
        </div>

        <Link href="/note/journal">
          <span className="text-xs font-semibold tracking-wide text-[#825a2e]">
            Open Journal →
          </span>
        </Link>
      </div>
    </article>
  );
}

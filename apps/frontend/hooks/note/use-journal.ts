'use client';

import { journalApi } from '@/lib/api/journal';
import { AUTOSAVE_DELAY, ShelfFilter } from '@/lib/constants/journal';
import { JournalResponse } from '@renjana/types';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

function splitContent(content: string): { title: string; body: string } {
  const normalized = (content ?? '').replace(/\r\n/g, '\n');
  const lineBreak = normalized.indexOf('\n');
  if (lineBreak === -1) {
    return { title: normalized.replace(/^#+\s*/, '').trim(), body: '' };
  }
  return {
    title: normalized
      .slice(0, lineBreak)
      .replace(/^#+\s*/, '')
      .trim(),
    body: normalized.slice(lineBreak + 1).replace(/^\n+/, ''),
  };
}

function toEntryDate(date = new Date()): string {
  return date.toISOString().slice(0, 10);
}

function toErrorMessage(err: unknown, fallback: string): string {
  return err instanceof Error ? err.message : fallback;
}

export function useJournal(initialItems: JournalResponse[] = []) {
  const hasInitial = initialItems.length > 0;

  const [items, setItems] = useState<JournalResponse[]>(initialItems);
  const [selectedId, setSelectedId] = useState<string | null>(initialItems[0]?.id ?? null);
  const [selected, setSelected] = useState<JournalResponse | null>(initialItems[0] ?? null);

  const [loading, setLoading] = useState<boolean>(!hasInitial);
  const [detailLoading, setDetailLoading] = useState<boolean>(false);
  const [creating, setCreating] = useState<boolean>(false);
  const [deleting, setDeleting] = useState<boolean>(false);
  const [sharing, setSharing] = useState<boolean>(false);

  const [saveState, setSaveState] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [error, setError] = useState<string | null>(null);

  const [search, setSearch] = useState<string>('');
  const [filter, setFilter] = useState<ShelfFilter>('semua');

  const [content, setContentState] = useState<string>(initialItems[0]?.content ?? '');
  const [tags, setTagsState] = useState<string[]>(initialItems[0]?.tags ?? []);

  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const selectedIdRef = useRef<string | null>(null);

  useEffect(() => {
    selectedIdRef.current = selectedId;
  }, [selectedId]);

  useEffect(() => {
    if (hasInitial) return;

    let ignore = false;

    const load = async () => {
      try {
        const res = await journalApi.getAll({ page: '1', limit: '50' });
        if (ignore) return;
        const list = (res.data as unknown as { items: JournalResponse[] }).items ?? [];
        setItems(list);
        if (list.length > 0) {
          const first = list[0];
          setSelectedId(first.id);
          setSelected(first);
          setContentState(first.content ?? '');
          setTagsState(first.tags ?? []);
        }
      } catch (err) {
        if (!ignore) setError(toErrorMessage(err, 'Gagal memuat jurnal.'));
      } finally {
        if (!ignore) setLoading(false);
      }
    };

    load();

    return () => {
      ignore = true;
    };
  }, [hasInitial]);

  const refetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await journalApi.getAll({ page: '1', limit: '50' });
      const list = (res.data as unknown as { items: JournalResponse[] }).items ?? [];
      setItems(list);
    } catch (err) {
      setError(toErrorMessage(err, 'Gagal memuat jurnal.'));
    } finally {
      setLoading(false);
    }
  }, []);

  const select = useCallback(
    async (id: string) => {
      if (id === selectedId) return;
      if (saveTimer.current) {
        clearTimeout(saveTimer.current);
        saveTimer.current = null;
      }
      setSelectedId(id);
      const cached = items.find((item) => item.id === id);
      if (cached) {
        setSelected(cached);
        setContentState(cached.content ?? '');
        setTagsState(cached.tags ?? []);
        setSaveState('idle');
      } else {
        setDetailLoading(true);
      }
      if (cached) setDetailLoading(true);
      try {
        const res = await journalApi.getById(id);
        const entry = res.data as unknown as JournalResponse;
        // Only apply if the user hasn't switched away during fetch.
        if (selectedIdRef.current === id) {
          setSelected(entry);
          setContentState(entry.content ?? '');
          setTagsState(entry.tags ?? []);
          setItems((prev) => prev.map((item) => (item.id === id ? entry : item)));
        }
      } catch (err) {
        if (selectedIdRef.current === id) {
          setError(toErrorMessage(err, 'Gagal membuka jurnal.'));
        }
      } finally {
        if (selectedIdRef.current === id) setDetailLoading(false);
      }
    },
    [items, selectedId],
  );

  const persist = useCallback(
    async (id: string, nextContent: string, nextTags: string[]) => {
      setSaveState('saving');
      try {
        const res = await journalApi.update({ content: nextContent, tags: nextTags }, id);
        const updated = res.data as unknown as JournalResponse;
        setSelected((prev) => (prev && prev.id === id ? updated : prev));
        setItems((prev) => prev.map((item) => (item.id === id ? updated : item)));
        setSaveState('saved');
      } catch {
        setSaveState('error');
      }
    },
    [],
  );

  const scheduleAutosave = useCallback(
    (id: string, nextContent: string, nextTags: string[]) => {
      if (saveTimer.current) clearTimeout(saveTimer.current);
      setSaveState('saving');
      saveTimer.current = setTimeout(() => {
        persist(id, nextContent, nextTags);
      }, AUTOSAVE_DELAY);
    },
    [persist],
  );

  useEffect(() => {
    return () => {
      if (saveTimer.current) clearTimeout(saveTimer.current);
    };
  }, []);

  const setContent = useCallback(
    (value: string) => {
      setContentState(value);
      if (!selectedId) return;
      scheduleAutosave(selectedId, value, tags);
    },
    [scheduleAutosave, selectedId, tags],
  );

  const setTags = useCallback(
    (value: string[]) => {
      setTagsState(value);
      if (!selectedId) return;
      scheduleAutosave(selectedId, content, value);
    },
    [scheduleAutosave, selectedId, content],
  );

  const retrySave = useCallback(() => {
    if (!selectedId) return;
    persist(selectedId, content, tags);
  }, [persist, selectedId, content, tags]);

  /* ---------------- Create ---------------- */
  const create = useCallback(async () => {
    if (creating) return null;
    setCreating(true);
    setError(null);
    try {
      const res = await journalApi.create({
        content: '# Tanpa Judul\n\nTulis apapun yang Anda rasakan',
        tags: [],
        entryDate: toEntryDate(),
        isShared: false,
      });
      const entry = res.data as unknown as JournalResponse;
      setItems((prev) => [entry, ...prev]);
      setSelectedId(entry.id);
      setSelected(entry);
      setContentState(entry.content ?? '');
      setTagsState(entry.tags ?? []);
      setSaveState('idle');
      return entry;
    } catch (err) {
      setError(toErrorMessage(err, 'Gagal membuat jurnal.'));
      return null;
    } finally {
      setCreating(false);
    }
  }, [creating]);

  /* ---------------- Delete ---------------- */
  const remove = useCallback(
    async (id: string) => {
      setDeleting(true);
      try {
        await journalApi.delete(id);
        const next = items.filter((item) => item.id !== id);
        setItems(next);
        if (selectedId === id) {
          const fallback = next[0] ?? null;
          setSelectedId(fallback?.id ?? null);
          setSelected(fallback);
          setContentState(fallback?.content ?? '');
          setTagsState(fallback?.tags ?? []);
          setSaveState('idle');
        }
        return true;
      } catch (err) {
        setError(toErrorMessage(err, 'Gagal menghapus jurnal.'));
        return false;
      } finally {
        setDeleting(false);
      }
    },
    [items, selectedId],
  );

  /* ---------------- Share toggle (own journals only) ---------------- */
  const toggleShare = useCallback(async () => {
    const target = selected;
    if (!target) return false;
    setSharing(true);
    try {
      const res = await journalApi.update({ isShared: !target.isShared }, target.id);
      const updated = res.data as unknown as JournalResponse;
      setItems((prev) => prev.map((item) => (item.id === target.id ? updated : item)));
      setSelected(updated);
      return true;
    } catch (err) {
      setError(toErrorMessage(err, 'Gagal mengubah status jurnal.'));
      return false;
    } finally {
      setSharing(false);
    }
  }, [selected]);

  /* ---------------- Derived: search + filter ---------------- */
  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    return items.filter((entry) => {
      if (filter === 'bersama' && !entry.isShared) return false;
      if (filter === 'privat' && entry.isShared) return false;
      if (!query) return true;
      const { title, body } = splitContent(entry.content ?? '');
      const haystack = `${title} ${body} ${(entry.tags ?? []).join(' ')}`.toLowerCase();
      return haystack.includes(query);
    });
  }, [items, search, filter]);

  const { title: selectedTitle } = useMemo(
    () => splitContent(selected?.content ?? ''),
    [selected],
  );

  const wordCount = useMemo(() => {
    const words = content.trim().split(/\s+/).filter(Boolean);
    return content.trim() ? words.length : 0;
  }, [content]);

  const sentenceCount = useMemo(() => {
    const sentences = content.split(/[.!?…]+/).filter((s) => s.trim().length > 0);
    return sentences.length;
  }, [content]);

  return {
    items,
    filtered,
    selected,
    selectedId,
    selectedTitle,
    content,
    tags,
    search,
    filter,
    loading,
    detailLoading,
    creating,
    deleting,
    sharing,
    saveState,
    error,
    wordCount,
    sentenceCount,
    setSearch,
    setFilter,
    setContent,
    setTags,
    select,
    create,
    remove,
    toggleShare,
    retrySave,
    refetch,
    dismissError: () => setError(null),
  };
}

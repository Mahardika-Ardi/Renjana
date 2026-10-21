'use client';

import { journalApi } from '@/lib/api/journal';
import {
  CACHE_TTL,
  cacheGet,
  cacheInvalidate,
  cacheKeys,
  cacheSet,
  invalidateJournals,
} from '@/lib/api/cache';
import { splitBody, splitTitleDisplay } from '@/lib/journal-content';
import {
  SAVE_INTERVAL,
  ShelfFilter,
  type SaveState,
} from '@/lib/constants/journal';
import {
  JournalResponse,
  ObjectPartnerJournalResponse,
  PartnerJournalEntry,
} from '@renjana/types';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

function toEntryDate(date = new Date()): string {
  return date.toISOString().slice(0, 10);
}

/** Cached partner feed snapshot (`notConnected` mirrors the backend message). */
interface PartnerFeed {
  items: PartnerJournalEntry[];
  notConnected: boolean;
}

/**
 * Partner entry → the shared JournalResponse shape so cards/editor/export
 * keep working unchanged. The feed already carries full content (detail
 * GET would 403), so no per-id fetch ever happens; the partner payload has
 * no updatedAt — createdAt is the honest stand-in.
 */
function toJournalView(entry: PartnerJournalEntry): JournalResponse {
  return {
    id: entry.id,
    userId: entry.user.id,
    content: entry.content,
    tags: entry.tags ?? [],
    entryDate: entry.entryDate,
    isShared: true,
    createdAt: entry.createdAt,
    updatedAt: entry.createdAt,
  };
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

  const [saveState, setSaveState] = useState<SaveState>('idle');
  const [error, setError] = useState<string | null>(null);

  const [search, setSearch] = useState<string>('');
  const [filter, setFilter] = useState<ShelfFilter>('semua');

  // Partner shared feed ("Jurnal Bersama" couple timeline). null = not
  // fetched yet — only requested on first Bersama visit.
  const [partnerItems, setPartnerItems] = useState<PartnerJournalEntry[] | null>(
    null,
  );
  const [partnerNotConnected, setPartnerNotConnected] = useState(false);
  const [partnerLoading, setPartnerLoading] = useState(false);

  // Read-only mode: a selected partner entry is never edited, saved,
  // shared, or deleted from this device.
  const [readOnly, setReadOnly] = useState(false);
  const [selectedAuthor, setSelectedAuthor] = useState<{
    name: string;
    avatarUrl: string | null;
  } | null>(null);

  const [content, setContentState] = useState<string>(initialItems[0]?.content ?? '');
  const [tags, setTagsState] = useState<string[]>(initialItems[0]?.tags ?? []);

  const selectedIdRef = useRef<string | null>(null);
  // Exactly one in-flight save at a time — this is what kills the
  // request pile-up the old per-keystroke autosave caused.
  const persistingRef = useRef(false);
  // Last persisted (or loaded) snapshot of the selected entry.
  const lastSavedRef = useRef<{ content: string; tags: string[] } | null>(
    null,
  );
  const saveRef = useRef<() => Promise<boolean>>(async () => false);

  useEffect(() => {
    selectedIdRef.current = selectedId;
  }, [selectedId]);

  // Snapshot for entries provided up-front (no fetch happens for them).
  useEffect(() => {
    if (hasInitial && initialItems[0] && !lastSavedRef.current) {
      lastSavedRef.current = {
        content: initialItems[0].content ?? '',
        tags: initialItems[0].tags ?? [],
      };
    }
  }, [hasInitial, initialItems]);

  useEffect(() => {
    if (hasInitial) return;

    let ignore = false;

    const applyList = (list: JournalResponse[]) => {
      setItems(list);
      if (list.length > 0) {
        const first = list[0];
        setSelectedId(first.id);
        setSelected(first);
        setContentState(first.content ?? '');
        setTagsState(first.tags ?? []);
        lastSavedRef.current = {
          content: first.content ?? '',
          tags: first.tags ?? [],
        };
      }
    };

    const load = async () => {
      // Instant render from cache (survives reloads); revalidate silently
      // when stale so reloads never wait on the network.
      const cached = cacheGet<JournalResponse[]>(cacheKeys.journalList);
      if (cached) {
        if (ignore) return;
        applyList(cached.value);
        setLoading(false);
        if (cached.fresh) return;
      }

      try {
        const res = await journalApi.getAll({ page: '1', limit: '50' });
        if (ignore) return;
        const list = (res.data as unknown as { items: JournalResponse[] }).items ?? [];
        cacheSet(cacheKeys.journalList, list, CACHE_TTL.JOURNAL_LIST);
        applyList(list);
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

  // Partner shared feed — lazily fetched on first visit to a merged view
  // (Semua / Jurnal Bersama; Privat never shows partner entries).
  // Cache-first (instant revisits), background revalidate when stale: our
  // own mutations never touch this feed, and the partner's share/unshare
  // from their device lands via the TTL — same cross-device staleness
  // contract as the other journal snapshots.
  useEffect(() => {
    if (filter === 'privat') return;

    let ignore = false;

    const apply = (feed: PartnerFeed) => {
      setPartnerItems(feed.items);
      setPartnerNotConnected(feed.notConnected);
    };

    const load = async () => {
      const cached = cacheGet<PartnerFeed>(cacheKeys.journalPartner);
      if (cached) {
        if (ignore) return;
        apply(cached.value);
        setPartnerLoading(false);
        if (cached.fresh) return;
      } else if (!ignore) {
        setPartnerLoading(true);
      }

      try {
        const res = await journalApi.getAllPartner({ page: '1', limit: '50' });
        if (ignore) return;
        const body = res.data as unknown as ObjectPartnerJournalResponse;
        const feed: PartnerFeed = {
          items: body.items ?? [],
          notConnected: Boolean(body.message),
        };
        cacheSet(cacheKeys.journalPartner, feed, CACHE_TTL.JOURNAL_PARTNER);
        apply(feed);
      } catch (err) {
        if (!ignore) {
          // Nothing usable: empty state instead of an endless skeleton —
          // nothing was cached, so the next Bersama visit retries.
          setPartnerItems((prev) => prev ?? []);
          setError(toErrorMessage(err, 'Gagal memuat jurnal pasangan.'));
        }
      } finally {
        if (!ignore) setPartnerLoading(false);
      }
    };

    void load();

    return () => {
      ignore = true;
    };
  }, [filter]);

  const refetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await journalApi.getAll({ page: '1', limit: '50' });
      const list = (res.data as unknown as { items: JournalResponse[] }).items ?? [];
      cacheSet(cacheKeys.journalList, list, CACHE_TTL.JOURNAL_LIST);
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
      setSelectedId(id);
      // Partner entry: read-only straight from the list payload —
      // GET /journal/:id would 403 on someone else's entry.
      const partner = (partnerItems ?? []).find((entry) => entry.id === id);
      if (partner) {
        const view = toJournalView(partner);
        setSelected(view);
        setContentState(view.content);
        setTagsState(view.tags);
        lastSavedRef.current = { content: view.content, tags: [...view.tags] };
        setSaveState('idle');
        setReadOnly(true);
        setSelectedAuthor({
          name: partner.user.name,
          avatarUrl: partner.user.avatarUrl,
        });
        setDetailLoading(false);
        return;
      }

      setReadOnly(false);
      setSelectedAuthor(null);
      const cached = items.find((item) => item.id === id);
      if (cached) {
        setSelected(cached);
        setContentState(cached.content ?? '');
        setTagsState(cached.tags ?? []);
        lastSavedRef.current = {
          content: cached.content ?? '',
          tags: cached.tags ?? [],
        };
        setSaveState('idle');
      } else {
        setDetailLoading(true);
      }
      if (cached) setDetailLoading(true);
      // Fresh detail cache: skip the network entirely on revisits.
      // (Synchronous here, right after setSelectedId(id), so `id` is
      // current by construction — no ref guard needed.)
      const detailCached = cacheGet<JournalResponse>(
        cacheKeys.journalDetail(id),
      );
      if (detailCached?.fresh) {
        setSelected(detailCached.value);
        setContentState(detailCached.value.content ?? '');
        setTagsState(detailCached.value.tags ?? []);
        lastSavedRef.current = {
          content: detailCached.value.content ?? '',
          tags: detailCached.value.tags ?? [],
        };
        setItems((prev) =>
          prev.map((item) => (item.id === id ? detailCached.value : item)),
        );
        setDetailLoading(false);
        return;
      }
      try {
        const res = await journalApi.getById(id);
        const entry = res.data as unknown as JournalResponse;
        // Only apply if the user hasn't switched away during fetch.
        if (selectedIdRef.current === id) {
          cacheSet(
            cacheKeys.journalDetail(id),
            entry,
            CACHE_TTL.JOURNAL_DETAIL,
          );
          setSelected(entry);
          setContentState(entry.content ?? '');
          setTagsState(entry.tags ?? []);
          lastSavedRef.current = {
            content: entry.content ?? '',
            tags: entry.tags ?? [],
          };
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
    [items, selectedId, partnerItems],
  );

  const persist = useCallback(
    async (id: string, nextContent: string, nextTags: string[]) => {
      if (readOnly) return false;
      if (persistingRef.current) return false;
      persistingRef.current = true;
      setSaveState('saving');
      try {
        const res = await journalApi.update({ content: nextContent, tags: nextTags }, id);
        const updated = res.data as unknown as JournalResponse;
        setSelected((prev) => (prev && prev.id === id ? updated : prev));
        setItems((prev) => prev.map((item) => (item.id === id ? updated : item)));
        if (selectedIdRef.current === id) {
          lastSavedRef.current = { content: nextContent, tags: [...nextTags] };
          setSaveState('saved');
        }
        // Content changed: list/latest snapshots are stale; refresh this
        // entry's detail cache with the server response.
        cacheInvalidate(cacheKeys.journalList);
        cacheInvalidate(cacheKeys.journalLatest);
        cacheSet(cacheKeys.journalDetail(id), updated, CACHE_TTL.JOURNAL_DETAIL);
        return true;
      } catch {
        setSaveState('error');
        return false;
      } finally {
        persistingRef.current = false;
      }
    },
    [readOnly],
  );

  const snapshotMatches = useCallback(
    (nextContent: string, nextTags: string[]) => {
      const snap = lastSavedRef.current;
      if (!snap) return false;
      return (
        nextContent === snap.content &&
        nextTags.length === snap.tags.length &&
        nextTags.every((tag) => snap.tags.includes(tag))
      );
    },
    [],
  );

  /* Explicit save: one PATCH per call, never overlapping, no-op when clean. */
  const save = useCallback(async () => {
    if (readOnly) return false;
    if (!selectedId) return false;
    if (persistingRef.current) return false;
    if (snapshotMatches(content, tags)) {
      setSaveState('saved');
      return true;
    }
    return persist(selectedId, content, tags);
  }, [persist, snapshotMatches, readOnly, selectedId, content, tags]);

  useEffect(() => {
    saveRef.current = save;
  }, [save]);

  /* Safety net: persist dirty entries every 3 minutes. The tick is a
     no-op when nothing is dirty, so idle users send zero requests. */
  useEffect(() => {
    const timer = setInterval(() => {
      void saveRef.current();
    }, SAVE_INTERVAL);
    return () => clearInterval(timer);
  }, []);

  const touchAfterEdit = useCallback(
    (nextContent: string, nextTags: string[]) => {
      setSaveState(snapshotMatches(nextContent, nextTags) ? 'saved' : 'dirty');
    },
    [snapshotMatches],
  );

  const setContent = useCallback(
    (value: string) => {
      setContentState(value);
      if (!selectedId) return;
      touchAfterEdit(value, tags);
    },
    [touchAfterEdit, selectedId, tags],
  );

  const setTags = useCallback(
    (value: string[]) => {
      setTagsState(value);
      if (!selectedId) return;
      touchAfterEdit(content, value);
    },
    [touchAfterEdit, selectedId, content],
  );

  const retrySave = useCallback(() => saveRef.current(), []);

  const discardChanges = useCallback(() => {
    const snap = lastSavedRef.current;
    if (snap) {
      setContentState(snap.content);
      setTagsState([...snap.tags]);
      setSaveState('saved');
    } else if (selected) {
      setContentState(selected.content ?? '');
      setTagsState(selected.tags ?? []);
      setSaveState('idle');
    }
  }, [selected]);

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
      lastSavedRef.current = {
        content: entry.content ?? '',
        tags: entry.tags ?? [],
      };
      // A fresh entry starts private — leave the shared timeline so the
      // user actually sees what they just created, and drop read-only.
      setReadOnly(false);
      setSelectedAuthor(null);
      setFilter((prev) => (prev === 'bersama' ? 'semua' : prev));
      // New first item: list/latest snapshots are stale.
      invalidateJournals();
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
      if (readOnly) return false;
      setDeleting(true);
      try {
        await journalApi.delete(id);
        const next = items.filter((item) => item.id !== id);
        setItems(next);
        invalidateJournals(id);
        if (selectedId === id) {
          const fallback = next[0] ?? null;
          setSelectedId(fallback?.id ?? null);
          setSelected(fallback);
          setContentState(fallback?.content ?? '');
          setTagsState(fallback?.tags ?? []);
          lastSavedRef.current = fallback
            ? { content: fallback.content ?? '', tags: fallback.tags ?? [] }
            : null;
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
    [items, selectedId, readOnly],
  );

  /* ---------------- Share toggle (own journals only) ---------------- */
  const toggleShare = useCallback(async () => {
    const target = selected;
    if (!target || readOnly) return false;
    setSharing(true);
    try {
      const res = await journalApi.update({ isShared: !target.isShared }, target.id);
      const updated = res.data as unknown as JournalResponse;
      setItems((prev) => prev.map((item) => (item.id === target.id ? updated : item)));
      setSelected(updated);
      // Share flag changed: list/latest/detail snapshots are stale.
      invalidateJournals(target.id);
      return true;
    } catch (err) {
      setError(toErrorMessage(err, 'Gagal mengubah status jurnal.'));
      return false;
    } finally {
      setSharing(false);
    }
  }, [selected, readOnly]);

  /* ---------------- Derived: search + filter ---------------- */
  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();

    // Semua = everything I own (private + shared) merged with the
    // partner's shared entries; Jurnal Bersama = the shared timeline
    // only; Privat = my non-shared entries only. Both merged views are
    // sorted newest entryDate first.
    const base =
      filter === 'privat'
        ? items.filter((entry) => !entry.isShared)
        : [
            ...items.filter(
              (entry) => filter !== 'bersama' || entry.isShared,
            ),
            ...(partnerItems ?? []).map(toJournalView),
          ].sort(
            (a, b) =>
              b.entryDate.localeCompare(a.entryDate) ||
              b.createdAt.localeCompare(a.createdAt),
          );

    return base.filter((entry) => {
      if (!query) return true;
      const title = splitTitleDisplay(entry.content ?? '');
      const body = splitBody(entry.content ?? '');
      const haystack = `${title} ${body} ${(entry.tags ?? []).join(' ')}`.toLowerCase();
      return haystack.includes(query);
    });
  }, [items, search, filter, partnerItems]);

  /** Author chip identity for partner-owned rows; null for your own. */
  const authorOf = useCallback(
    (entry: JournalResponse) =>
      partnerItems?.find((p) => p.id === entry.id)?.user ?? null,
    [partnerItems],
  );

  const selectedTitle = useMemo(
    () => splitTitleDisplay(selected?.content ?? ''),
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
    readOnly,
    selectedAuthor,
    partnerLoading,
    partnerNotConnected,
    authorOf,
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
    save,
    retrySave,
    discardChanges,
    isDirty: saveState === 'dirty',
    refetch,
    dismissError: () => setError(null),
  };
}

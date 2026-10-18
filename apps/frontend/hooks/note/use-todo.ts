'use client';

import { todoApi } from '@/lib/api/todo';
import {
  CACHE_TTL,
  cacheGet,
  cacheKeys,
  cacheSet,
  invalidateTodos,
} from '@/lib/api/cache';
import {
  CreateTodoDto,
  TodoResponse,
  UpdateTodoDto,
} from '@renjana/types';
import { useCallback, useEffect, useState } from 'react';

function toErrorMessage(err: unknown, fallback: string): string {
  return err instanceof Error ? err.message : fallback;
}

function applyToggleLocal(item: TodoResponse): TodoResponse {
  const completed = item.status !== 'COMPLETED';
  return {
    ...item,
    status: completed ? 'COMPLETED' : 'PENDING',
    completedAt: completed ? new Date().toISOString() : null,
  };
}

export function useTodos() {
  const [items, setItems] = useState<TodoResponse[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [creating, setCreating] = useState<boolean>(false);
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<boolean>(false);

  useEffect(() => {
    let ignore = false;

    const load = async () => {
      // Instant render from cache (survives reloads); revalidate silently
      // when stale so reloads never wait on the network.
      const cached = cacheGet<TodoResponse[]>(cacheKeys.todoList);
      if (cached) {
        if (ignore) return;
        setItems(cached.value);
        setLoading(false);
        if (cached.fresh) return;
      }

      try {
        const res = await todoApi.getAll();
        if (ignore) return;
        const list =
          (res.data as unknown as { items: TodoResponse[] }).items ?? [];
        cacheSet(cacheKeys.todoList, list, CACHE_TTL.TODO_LIST);
        setItems(list);
      } catch (err) {
        if (!ignore) setError(toErrorMessage(err, 'Gagal memuat tugas.'));
      } finally {
        if (!ignore) setLoading(false);
      }
    };

    load();

    return () => {
      ignore = true;
    };
  }, []);

  const refetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await todoApi.getAll();
      const list =
        (res.data as unknown as { items: TodoResponse[] }).items ?? [];
      cacheSet(cacheKeys.todoList, list, CACHE_TTL.TODO_LIST);
      setItems(list);
    } catch (err) {
      setError(toErrorMessage(err, 'Gagal memuat tugas.'));
    } finally {
      setLoading(false);
    }
  }, []);

  const create = useCallback(async (dto: CreateTodoDto) => {
    if (creating) return null;
    setCreating(true);
    setError(null);
    try {
      const res = await todoApi.create(dto);
      const item = res.data as unknown as TodoResponse;
      setItems((prev) => [item, ...prev]);
      invalidateTodos();
      return item;
    } catch (err) {
      setError(toErrorMessage(err, 'Gagal membuat tugas.'));
      return null;
    } finally {
      setCreating(false);
    }
  }, [creating]);

  /* Optimistic flip: instant UI, server truth on success, rollback on failure. */
  const toggle = useCallback(
    async (id: string) => {
      if (togglingId) return false;
      const previous = items.find((item) => item.id === id);
      if (!previous) return false;
      setTogglingId(id);
      setItems((prev) =>
        prev.map((item) => (item.id === id ? applyToggleLocal(item) : item)),
      );
      try {
        const res = await todoApi.toggle(id);
        const updated = res.data as unknown as TodoResponse;
        setItems((prev) =>
          prev.map((item) => (item.id === id ? updated : item)),
        );
        invalidateTodos();
        return true;
      } catch (err) {
        setItems((prev) =>
          prev.map((item) => (item.id === id ? previous : item)),
        );
        setError(toErrorMessage(err, 'Gagal mengubah status tugas.'));
        return false;
      } finally {
        setTogglingId(null);
      }
    },
    [items, togglingId],
  );

  const update = useCallback(
    async (id: string, dto: UpdateTodoDto) => {
      setError(null);
      try {
        const res = await todoApi.update(dto, id);
        const updated = res.data as unknown as TodoResponse;
        setItems((prev) =>
          prev.map((item) => (item.id === id ? updated : item)),
        );
        invalidateTodos();
        return updated;
      } catch (err) {
        setError(toErrorMessage(err, 'Gagal memperbarui tugas.'));
        return null;
      }
    },
    [],
  );

  const remove = useCallback(
    async (id: string) => {
      setDeleting(true);
      try {
        await todoApi.delete(id);
        setItems((prev) => prev.filter((item) => item.id !== id));
        invalidateTodos();
        return true;
      } catch (err) {
        setError(toErrorMessage(err, 'Gagal menghapus tugas.'));
        return false;
      } finally {
        setDeleting(false);
      }
    },
    [],
  );

  const pendingCount = items.filter(
    (item) => item.status === 'PENDING',
  ).length;

  return {
    items,
    loading,
    creating,
    togglingId,
    deleting,
    error,
    pendingCount,
    create,
    toggle,
    update,
    remove,
    refetch,
    dismissError: () => setError(null),
  };
}

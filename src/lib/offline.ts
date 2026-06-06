/**
 * Offline cache for Umriq — backs offers + conversations with IndexedDB.
 * Hydrate from cache instantly; refresh in background when online.
 */
import { get, set } from "idb-keyval";
import { useEffect } from "react";
import { useQueryClient, type QueryKey } from "@tanstack/react-query";

const KEY_PREFIX = "umriq.cache.v1.";

export async function readCache<T>(key: string): Promise<T | undefined> {
  if (typeof indexedDB === "undefined") return undefined;
  try {
    return (await get(KEY_PREFIX + key)) as T | undefined;
  } catch {
    return undefined;
  }
}

export async function writeCache<T>(key: string, value: T): Promise<void> {
  if (typeof indexedDB === "undefined") return;
  try {
    await set(KEY_PREFIX + key, value);
  } catch {
    /* quota / private mode — silent */
  }
}

/** Persist a query's data into IndexedDB whenever it changes. */
export function usePersistQuery(key: string, queryKey: QueryKey) {
  const qc = useQueryClient();
  useEffect(() => {
    const unsub = qc.getQueryCache().subscribe((event) => {
      if (event.type !== "updated") return;
      const q = event.query;
      if (JSON.stringify(q.queryKey) !== JSON.stringify(queryKey)) return;
      if (q.state.status === "success" && q.state.data !== undefined) {
        void writeCache(key, q.state.data);
      }
    });
    return () => unsub();
  }, [qc, key, JSON.stringify(queryKey)]); // eslint-disable-line react-hooks/exhaustive-deps
}

/** On mount, seed a query's cache from IndexedDB if it has no data yet. */
export function useHydrateQuery<T>(key: string, queryKey: QueryKey) {
  const qc = useQueryClient();
  useEffect(() => {
    let cancelled = false;
    if (qc.getQueryData(queryKey) !== undefined) return;
    readCache<T>(key).then((cached) => {
      if (cancelled || cached === undefined) return;
      if (qc.getQueryData(queryKey) === undefined) {
        qc.setQueryData(queryKey, cached);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [qc, key, JSON.stringify(queryKey)]); // eslint-disable-line react-hooks/exhaustive-deps
}

export function useOnlineStatus(): boolean {
  if (typeof navigator === "undefined") return true;
  return navigator.onLine;
}

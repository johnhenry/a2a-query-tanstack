// Live sync bridge: mirrors a2aq's OWN cache writes — task/card refetches,
// push-folded updates, optimistic patch()/rollback — straight into TanStack
// Query's cache via `setQueryData`. No extra refetch: for an actively-bridged
// query, a2aq's cache (a real @johnhenry/agent-query-core QueryCache — a2aq
// doesn't fork it) is the source of truth and TanStack Query is a
// reactively-synced mirror.
//
// Registration is lazy and memoized per (A2AQuery, QueryClient, queryKey) —
// `ensureSynced` is called from inside each queryOptions() factory's queryFn.
// Teardown is driven by TanStack's OWN lifecycle: a global
// `queryClient.getQueryCache()` listener (registered once per QueryClient)
// releases the a2aq-side `cache.subscribe()` ref when TanStack
// garbage-collects the bridged query.

import type { QueryClient } from "@tanstack/react-query";
import type { A2AKey, A2AQuery } from "@johnhenry/a2aq";

interface SyncState {
  unsubs: Map<string, () => void>;
}

const syncState = new WeakMap<A2AQuery, WeakMap<QueryClient, SyncState>>();

function keyOf(queryKey: readonly unknown[]): string {
  return JSON.stringify(queryKey);
}

function stateFor(client: A2AQuery, queryClient: QueryClient): SyncState {
  let perQueryClient = syncState.get(client);
  if (!perQueryClient) syncState.set(client, (perQueryClient = new WeakMap()));
  let state = perQueryClient.get(queryClient);
  if (!state) {
    state = { unsubs: new Map() };
    perQueryClient.set(queryClient, state);
    queryClient.getQueryCache().subscribe((event) => {
      if (event.type !== "removed") return;
      const k = keyOf(event.query.queryKey);
      const unsubscribe = state!.unsubs.get(k);
      if (unsubscribe) {
        unsubscribe();
        state!.unsubs.delete(k);
      }
    });
  }
  return state;
}

/**
 * Register the live sync for one bridged query, once. Called internally by
 * every `queryOptions()` factory in this package — most consumers never call
 * this directly.
 */
export function ensureSynced(client: A2AQuery, queryClient: QueryClient, cacheKey: A2AKey, queryKey: readonly unknown[]): void {
  const state = stateFor(client, queryClient);
  const k = keyOf(queryKey);
  if (state.unsubs.has(k)) return;
  const unsubscribe = client.cache.subscribe(cacheKey, () => {
    const entry = client.cache.getSnapshot(cacheKey);
    if (entry?.status === "success") queryClient.setQueryData(queryKey as unknown[], entry.data);
  });
  state.unsubs.set(k, unsubscribe);
}

/**
 * Explicitly wire the sync bridge for a `(client, queryClient)` pair ahead of
 * any query running (idempotent). Returns a teardown releasing every
 * currently-bridged subscription; individual queries still self-register
 * lazily via `queryOptions()` regardless of whether this was called.
 */
export function attachA2aqSync(client: A2AQuery, queryClient: QueryClient): () => void {
  const state = stateFor(client, queryClient);
  return () => {
    for (const unsubscribe of state.unsubs.values()) unsubscribe();
    state.unsubs.clear();
  };
}

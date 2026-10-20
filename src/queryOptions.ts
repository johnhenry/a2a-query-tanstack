// queryOptions() factories bridging a2a-query's own reads into TanStack Query.
// Sync propagation (attachA2aqSync, in bridge.ts) is what actually keeps a
// bridged query's TanStack cache entry fresh on task/card refetch, push
// events, and optimistic patches — the queryFn here only supplies the FIRST
// fetch + the type-safe queryKey/queryFn pairing queryOptions() exists for.

import type { DataTag, QueryFunctionContext, QueryObserverOptions } from "@tanstack/query-core";
import type { AgentCard, Task } from "@a2a-js/sdk";
import type { A2AQuery } from "@johnhenry/a2a-query";
import { cardQueryKey, taskQueryKey } from "./keys.js";
import { ensureSynced } from "./bridge.js";

/** `queryOptions()`-shaped result: the caller's extra options plus the bridge's key and fetcher. */
export type A2aqQueryOptions<T> = Omit<Partial<QueryObserverOptions<T>>, "queryKey" | "queryFn"> & {
  queryKey: DataTag<readonly unknown[], T, Error>;
  queryFn: (ctx: QueryFunctionContext<readonly unknown[]>) => Promise<T>;
};

// Same runtime shape as TanStack's own queryOptions() (an identity helper); the
// DataTag brand is what lets useQuery()/fetchQuery() infer the data type from the key.
export function a2aqTaskQueryOptions(client: A2AQuery, agent: string, taskId: string, opts: Partial<QueryObserverOptions<Task>> = {}): A2aqQueryOptions<Task> {
  const key = taskQueryKey(agent, taskId);
  return {
    ...opts,
    queryKey: key as unknown as DataTag<readonly unknown[], Task, Error>,
    queryFn: async ({ client: queryClient }: QueryFunctionContext<readonly unknown[]>) => {
      ensureSynced(client, queryClient, { kind: "task", agent, taskId }, key);
      const handle = await client.task(agent, taskId);
      return handle.task()!;
    },
  };
}

export function a2aqCardQueryOptions(client: A2AQuery, agent: string, opts: { refresh?: boolean } & Partial<QueryObserverOptions<AgentCard>> = {}): A2aqQueryOptions<AgentCard> {
  const key = cardQueryKey(agent);
  return {
    ...opts,
    queryKey: key as unknown as DataTag<readonly unknown[], AgentCard, Error>,
    queryFn: async ({ client: queryClient }: QueryFunctionContext<readonly unknown[]>) => {
      ensureSynced(client, queryClient, { kind: "card", agent }, key);
      return client.card(agent, { refresh: opts.refresh });
    },
  };
}

// queryOptions() factories bridging a2aq's own reads into TanStack Query.
// Sync propagation (attachA2aqSync, in bridge.ts) is what actually keeps a
// bridged query's TanStack cache entry fresh on task/card refetch, push
// events, and optimistic patches — the queryFn here only supplies the FIRST
// fetch + the type-safe queryKey/queryFn pairing queryOptions() exists for.

import { queryOptions, type UseQueryOptions } from "@tanstack/react-query";
import type { AgentCard, Task } from "@a2a-js/sdk";
import type { A2AQuery } from "@johnhenry/a2aq";
import { cardQueryKey, taskQueryKey } from "./keys.js";
import { ensureSynced } from "./bridge.js";

export function a2aqTaskQueryOptions(client: A2AQuery, agent: string, taskId: string, opts: Partial<UseQueryOptions<Task>> = {}) {
  const key = taskQueryKey(agent, taskId);
  return queryOptions<Task>({
    ...opts,
    queryKey: key,
    queryFn: async ({ client: queryClient }) => {
      ensureSynced(client, queryClient, { kind: "task", agent, taskId }, key);
      const handle = await client.task(agent, taskId);
      return handle.task()!;
    },
  });
}

export function a2aqCardQueryOptions(client: A2AQuery, agent: string, opts: { refresh?: boolean } & Partial<UseQueryOptions<AgentCard>> = {}) {
  const key = cardQueryKey(agent);
  return queryOptions<AgentCard>({
    ...opts,
    queryKey: key,
    queryFn: async ({ client: queryClient }) => {
      ensureSynced(client, queryClient, { kind: "card", agent }, key);
      return client.card(agent, { refresh: opts.refresh });
    },
  });
}

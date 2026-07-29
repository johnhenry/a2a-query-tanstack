# @johnhenry/a2aq-tanstack

TanStack Query bridge for [`@johnhenry/a2aq`](https://github.com/johnhenry/a2a-query) — `queryOptions`/`mutationOptions` factories that delegate fetching to a2aq while syncing its own reactive cache into TanStack Query's, with zero extra refetches.

## Install

```sh
npm install @johnhenry/a2aq-tanstack @johnhenry/a2aq @tanstack/react-query
```

## Usage

```ts
import { QueryClient, useQuery } from "@tanstack/react-query";
import { A2AQuery } from "@johnhenry/a2aq";
import { a2aqTaskQueryOptions, a2aqCardQueryOptions, a2aqSendMessageMutationOptions } from "@johnhenry/a2aq-tanstack";

const queryClient = new QueryClient();
const a2aq = new A2AQuery({ agents: { support: { url: "https://support.example.com/a2a" } } });

function TaskView({ agent, taskId }: { agent: string; taskId: string }) {
  const { data: task } = useQuery(a2aqTaskQueryOptions(a2aq, agent, taskId), queryClient);
  return <div>{task?.status?.state}</div>;
}
```

## How the sync bridge works

Every `queryOptions()` factory lazily registers a listener on a2aq's own cache the first time a query actually runs (`ensureSynced`, or call `attachA2aqSync(client, queryClient)` explicitly up front). From then on, task/card refetches, protocol push events folded via `ingestPush`, and optimistic `patch()`/rollback all mirror straight into TanStack Query's cache via `setQueryData` — no extra network round-trip. `a2aq.cache` is a real `@johnhenry/agent-query-core` `QueryCache`, not a fork, so this bridge consumes its stable, public `subscribe`/`getSnapshot` API directly.

TanStack's own `staleTime`/`gcTime` still apply as a safety margin on top — but for an actively-rendered bridged query, a2aq's cache is the source of truth. When TanStack garbage-collects a query nobody renders anymore (a `QueryCache` `'removed'` event), the bridge releases its a2aq-side subscription too, so nothing leaks.

## Mutations

`a2aqSendMessageMutationOptions` wraps `sendMessage`; on success (a `TaskHandle` reply) it invalidates that task's query. Optimistic updates aren't reimplemented on the TanStack side — call a2aq's own optimistic/patch mechanism inside your own `mutationFn` and the sync bridge propagates it automatically, the same way it propagates a server-confirmed write.

## Scope

Verification/simulation-shaped: this package only bridges reads (`task`, `card`) and the one send mutation. `respond`/`cancel`/artifacts are not yet wrapped in `queryOptions`/`mutationOptions` — use `A2AQuery`/`TaskHandle` directly for those; PRs welcome.

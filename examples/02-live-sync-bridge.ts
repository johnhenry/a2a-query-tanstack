// 02 · Live sync bridge — a2a-query's own cache writes (poll/push folded task
// updates) mirrored into TanStack Query via setQueryData, with zero TanStack
// refetches: watch the bridged entry change while nothing re-runs the queryFn.
// Run: npx tsx examples/02-live-sync-bridge.ts   (in-process mock agent — no network)

import { QueryClient } from "@tanstack/react-query";
import { A2AQuery, type TaskHandle } from "@johnhenry/a2a-query";
import { MockA2AAgent, echoExecutor } from "@johnhenry/a2a-query/testing";
import { a2aqTaskQueryOptions } from "../src/index.js";
import { TaskState, type Message, type Task } from "@a2a-js/sdk";

const msg = (text: string): Message =>
  ({ messageId: `m-${Math.random()}`, role: "user", parts: [{ content: { $case: "text", value: text } }] }) as never;

const mock = new MockA2AAgent(echoExecutor());
const client = new A2AQuery({ agents: { echo: { url: mock.url, fetchImpl: mock.fetchImpl } }, taskPollMs: 25 });
const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false, staleTime: Infinity } } });

const handle = (await client.sendMessage("echo", msg("work on this"))) as TaskHandle;
const opts = a2aqTaskQueryOptions(client, "echo", handle.taskId);

// The FIRST run of the queryFn registers the bridge (ensureSynced) for this key.
await queryClient.fetchQuery(opts);

// Observe TanStack's cache directly: every event from here on is setQueryData
// pushed by the bridge as a2a-query's poll loop folds in task updates —
// fetchQuery is never called again.
let fetches = 0;
const origFetch = queryClient.fetchQuery.bind(queryClient);
queryClient.fetchQuery = ((...args: Parameters<typeof origFetch>) => {
  fetches++;
  return origFetch(...args);
}) as typeof queryClient.fetchQuery;

const seen: string[] = [];
const unsubscribe = queryClient.getQueryCache().subscribe((event) => {
  if (event.type !== "updated") return;
  const state = (event.query.state.data as Task | undefined)?.status?.state;
  if (state !== undefined && TaskState[state] !== seen[seen.length - 1]) {
    seen.push(TaskState[state]);
    console.log("TanStack cache saw status:", TaskState[state]);
  }
});

await handle.result(); // agent runs to completion; the bridge mirrors each transition
await new Promise((r) => setTimeout(r, 50));
unsubscribe();

console.log("status states observed in TanStack's cache:", seen);
console.log("TanStack refetches while all that happened:", fetches); // 0
queryClient.clear();

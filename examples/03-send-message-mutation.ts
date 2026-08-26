// 03 · Send-message mutation — mutationOptions() run headless through
// MutationObserver (what useMutation wraps): sendMessage via the factory, and
// the TaskHandle reply invalidating its own task queryKey in onSuccess.
// Run: npx tsx examples/03-send-message-mutation.ts   (in-process mock agent — no network)

import { MutationObserver, QueryClient } from "@tanstack/react-query";
import { A2AQuery, type TaskHandle } from "@johnhenry/a2a-query";
import { MockA2AAgent, echoExecutor } from "@johnhenry/a2a-query/testing";
import { a2aqSendMessageMutationOptions, taskQueryKey } from "../src/index.js";
import type { Message } from "@a2a-js/sdk";

const msg = (text: string): Message =>
  ({ messageId: `m-${Math.random()}`, role: "user", parts: [{ content: { $case: "text", value: text } }] }) as never;

const mock = new MockA2AAgent(echoExecutor());
const client = new A2AQuery({ agents: { echo: { url: mock.url, fetchImpl: mock.fetchImpl } }, taskPollMs: 25 });
const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });

// Log invalidations so the onSuccess behavior is visible.
const invalidated: unknown[] = [];
const origInvalidate = queryClient.invalidateQueries.bind(queryClient);
queryClient.invalidateQueries = ((filters?: { queryKey?: unknown }) => {
  invalidated.push(filters?.queryKey);
  return origInvalidate(filters as never);
}) as typeof queryClient.invalidateQueries;

// The factory needs the QueryClient explicitly — onSuccess isn't handed one.
const opts = a2aqSendMessageMutationOptions(client, queryClient, "echo");
const observer = new MutationObserver(queryClient, opts);

const reply = await observer.mutate(msg("please do the thing"));
const handle = reply as TaskHandle;
console.log("reply is a TaskHandle for task:", handle.taskId);
console.log("invalidated queryKeys:", invalidated); // [ [ 'a2a-query', 'echo', 'task', <id> ] ]
console.log("matches taskQueryKey():", JSON.stringify(invalidated[0]) === JSON.stringify(taskQueryKey("echo", handle.taskId)));

await handle.result(); // let the task finish so the poll loop stops
queryClient.clear();

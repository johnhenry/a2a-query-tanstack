// 01 · Task & card queries — the factories driven headless in plain Node:
// queryOptions() + QueryClient.fetchQuery, no React, no DOM.
// Run: npx tsx examples/01-task-and-card-query.ts   (in-process mock agent — no network)

import { QueryClient } from "@tanstack/react-query";
import { A2AQuery, type TaskHandle } from "@johnhenry/a2a-query";
import { MockA2AAgent, echoExecutor } from "@johnhenry/a2a-query/testing";
import { a2aqCardQueryOptions, a2aqTaskQueryOptions } from "../src/index.js";
import { TaskState, type Message } from "@a2a-js/sdk";

const msg = (text: string): Message =>
  ({ messageId: `m-${Math.random()}`, role: "user", parts: [{ content: { $case: "text", value: text } }] }) as never;

const mock = new MockA2AAgent(echoExecutor(), { name: "echo-agent" });
const client = new A2AQuery({ agents: { echo: { url: mock.url, fetchImpl: mock.fetchImpl } }, taskPollMs: 25 });
const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false, staleTime: Infinity } } });

// ── card ── the factory pins the queryKey; fetchQuery stands in for useQuery.
const cardOpts = a2aqCardQueryOptions(client, "echo");
console.log("card queryKey:", cardOpts.queryKey); // [ 'a2a-query', 'echo', 'card' ]
const card = await queryClient.fetchQuery(cardOpts);
console.log("agent:", card.name); // echo-agent

// ── task ── only mount task queries for taskIds you actually hold: send first.
const handle = (await client.sendMessage("echo", msg("hello, agent"))) as TaskHandle;
const taskOpts = a2aqTaskQueryOptions(client, "echo", handle.taskId);
console.log("task queryKey:", taskOpts.queryKey); // [ 'a2a-query', 'echo', 'task', <id> ]

const task = await queryClient.fetchQuery(taskOpts);
console.log("first fetch, status:", TaskState[task.status!.state]);

// A second fetch is a cache read on BOTH sides — TanStack (staleTime) and
// a2a-query (its own QueryCache) — no extra network round-trip.
const again = queryClient.getQueryData(taskOpts.queryKey);
console.log("cached read is the same snapshot:", again === task);

await handle.result(); // let the echo task complete so the poll loop stops
queryClient.clear();

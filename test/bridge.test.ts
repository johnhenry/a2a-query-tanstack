import { describe, it, expect } from "vitest";
import { QueryClient } from "@tanstack/react-query";
import { A2AQuery } from "@johnhenry/a2aq";
import { MockA2AAgent, echoExecutor } from "@johnhenry/a2aq/testing";
import { ensureSynced } from "../src/bridge.js";
import { taskQueryKey } from "../src/keys.js";
import type { Message } from "@a2a-js/sdk";

const msg = (text: string): Message =>
  ({ messageId: `m-${Math.random()}`, role: "user", parts: [{ content: { $case: "text", value: text } }] }) as never;

const tick = (ms = 20) => new Promise((r) => setTimeout(r, ms));

describe("ensureSynced (live sync bridge, real agent-query-core QueryCache)", () => {
  it("mirrors cache writes into TanStack via setQueryData, without an extra client read", async () => {
    const mock = new MockA2AAgent(echoExecutor());
    const client = new A2AQuery({ agents: { a1: { url: mock.url, fetchImpl: mock.fetchImpl } }, taskPollMs: 15 });
    const sent = (await client.sendMessage("a1", msg("hi"))) as { taskId: string };
    const qc = new QueryClient();

    const cacheKey = { kind: "task" as const, agent: "a1", taskId: sent.taskId };
    const queryKey = taskQueryKey("a1", sent.taskId);
    ensureSynced(client, qc, cacheKey, queryKey);

    // Drive a real write on the SAME QueryCache instance a2aq uses internally —
    // no mock/fake, this is agent-query-core's real class.
    client.cache.write(cacheKey, { id: sent.taskId, status: { state: 99 } } as never, { tags: [] });
    await tick();

    expect(qc.getQueryData(queryKey as unknown[])).toMatchObject({ id: sent.taskId });
  });

  it("registering the same (client, queryClient, queryKey) twice only subscribes once", async () => {
    const mock = new MockA2AAgent(echoExecutor());
    const client = new A2AQuery({ agents: { a1: { url: mock.url, fetchImpl: mock.fetchImpl } }, taskPollMs: 15 });
    const sent = (await client.sendMessage("a1", msg("hi"))) as { taskId: string };
    const qc = new QueryClient();
    const cacheKey = { kind: "task" as const, agent: "a1", taskId: sent.taskId };
    const queryKey = taskQueryKey("a1", sent.taskId);

    ensureSynced(client, qc, cacheKey, queryKey);
    const subscribersBefore = client.cache.getSnapshot(cacheKey)?.subscribers;
    ensureSynced(client, qc, cacheKey, queryKey);
    expect(client.cache.getSnapshot(cacheKey)?.subscribers).toBe(subscribersBefore);
  });

  it("releases the a2aq-side subscription when TanStack removes the query (gc)", async () => {
    const mock = new MockA2AAgent(echoExecutor());
    const client = new A2AQuery({ agents: { a1: { url: mock.url, fetchImpl: mock.fetchImpl } }, taskPollMs: 15 });
    const sent = (await client.sendMessage("a1", msg("hi"))) as { taskId: string };
    const qc = new QueryClient();
    const cacheKey = { kind: "task" as const, agent: "a1", taskId: sent.taskId };
    const queryKey = taskQueryKey("a1", sent.taskId);

    ensureSynced(client, qc, cacheKey, queryKey);
    expect(client.cache.getSnapshot(cacheKey)?.subscribers).toBeGreaterThan(0);

    qc.setQueryData(queryKey as unknown[], { seed: true });
    qc.getQueryCache().remove(qc.getQueryCache().find({ queryKey: queryKey as unknown[] })!);

    expect(client.cache.getSnapshot(cacheKey)?.subscribers).toBe(0);
  });
});

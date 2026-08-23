import { describe, it, expect } from "vitest";
import { QueryClient } from "@tanstack/react-query";
import { A2AQuery } from "@johnhenry/a2a-query";
import { MockA2AAgent, echoExecutor } from "@johnhenry/a2a-query/testing";
import { a2aqCardQueryOptions, a2aqTaskQueryOptions } from "../src/queryOptions.js";
import type { Message } from "@a2a-js/sdk";

const msg = (text: string): Message =>
  ({ messageId: `m-${Math.random()}`, role: "user", parts: [{ content: { $case: "text", value: text } }] }) as never;

function newQueryClient(): QueryClient {
  return new QueryClient({ defaultOptions: { queries: { retry: false } } });
}

describe("a2aqTaskQueryOptions", () => {
  it("queryFn delegates to client.task and the queryKey matches (agent, taskId)", async () => {
    const mock = new MockA2AAgent(echoExecutor());
    const client = new A2AQuery({ agents: { a1: { url: mock.url, fetchImpl: mock.fetchImpl } }, taskPollMs: 15 });

    const sent = (await client.sendMessage("a1", msg("hi"))) as { taskId: string };
    const qc = newQueryClient();
    const opts = a2aqTaskQueryOptions(client, "a1", sent.taskId);
    expect(opts.queryKey).toEqual(["a2a-query", "a1", "task", sent.taskId]);
    const task = await qc.fetchQuery(opts);
    expect(task.id).toBe(sent.taskId);
  });
});

describe("a2aqCardQueryOptions", () => {
  it("queryFn delegates to client.card and the queryKey matches the agent", async () => {
    const mock = new MockA2AAgent(echoExecutor(), { name: "support-agent" });
    const client = new A2AQuery({ agents: { a1: { url: mock.url, fetchImpl: mock.fetchImpl } } });

    const qc = newQueryClient();
    const opts = a2aqCardQueryOptions(client, "a1");
    expect(opts.queryKey).toEqual(["a2a-query", "a1", "card"]);
    const card = await qc.fetchQuery(opts);
    expect(card.name).toBe("support-agent");
  });
});

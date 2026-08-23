import { describe, it, expect } from "vitest";
import { QueryClient } from "@tanstack/react-query";
import { A2AQuery } from "@johnhenry/a2a-query";
import { MockA2AAgent, echoExecutor } from "@johnhenry/a2a-query/testing";
import { a2aqSendMessageMutationOptions } from "../src/mutationOptions.js";
import type { Message } from "@a2a-js/sdk";

const msg = (text: string): Message =>
  ({ messageId: `m-${Math.random()}`, role: "user", parts: [{ content: { $case: "text", value: text } }] }) as never;

describe("a2aqSendMessageMutationOptions", () => {
  it("mutationFn delegates to client.sendMessage", async () => {
    const mock = new MockA2AAgent(echoExecutor());
    const client = new A2AQuery({ agents: { a1: { url: mock.url, fetchImpl: mock.fetchImpl } }, taskPollMs: 15 });
    const qc = new QueryClient();

    const opts = a2aqSendMessageMutationOptions(client, qc, "a1");
    const result = await opts.mutationFn!(msg("hi"), { client: qc, meta: undefined });
    expect(result).toBeDefined();
  });

  it("onSuccess invalidates the task's own queryKey for a TaskHandle reply", async () => {
    const mock = new MockA2AAgent(echoExecutor());
    const client = new A2AQuery({ agents: { a1: { url: mock.url, fetchImpl: mock.fetchImpl } }, taskPollMs: 15 });
    const qc = new QueryClient();
    const invalidated: unknown[] = [];
    qc.invalidateQueries = ((filters: unknown) => {
      invalidated.push(filters);
      return Promise.resolve();
    }) as typeof qc.invalidateQueries;

    const opts = a2aqSendMessageMutationOptions(client, qc, "a1");
    const result = (await opts.mutationFn!(msg("hi"), { client: qc, meta: undefined })) as { taskId: string };
    await (opts.onSuccess as (...args: unknown[]) => unknown)?.(result);

    expect(invalidated).toEqual([{ queryKey: ["a2a-query", "a1", "task", result.taskId] }]);
  });
});

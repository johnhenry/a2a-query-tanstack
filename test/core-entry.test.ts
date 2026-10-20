// The package must be usable without React: a Svelte/Vue/vanilla app (or a
// notebook runtime) installs @tanstack/query-core alone. Static + functional checks.

import { describe, it, expect } from "vitest";
import { readdirSync, readFileSync } from "node:fs";
import { QueryClient } from "@tanstack/query-core";
import { useQuery } from "@tanstack/react-query";
import type { Task } from "@a2a-js/sdk";
import { A2AQuery } from "@johnhenry/a2a-query";
import { MockA2AAgent, echoExecutor } from "@johnhenry/a2a-query/testing";
import * as core from "../src/core.js";
import * as root from "../src/index.js";

const pkg = JSON.parse(readFileSync("package.json", "utf8")) as {
  exports: Record<string, { types: string; default: string }>;
  peerDependencies: Record<string, string>;
  peerDependenciesMeta?: Record<string, { optional?: boolean }>;
};

describe("React-free entry", () => {
  it("no source file imports react or @tanstack/react-query", () => {
    for (const f of readdirSync("src").filter((n) => n.endsWith(".ts"))) {
      const src = readFileSync(`src/${f}`, "utf8");
      expect(src, f).not.toMatch(/from\s+["'](react|@tanstack\/react-query)(\/[^"']*)?["']/);
    }
  });

  it("package.json exposes ./core and makes React packages optional peers", () => {
    expect(pkg.exports["./core"]).toEqual({ types: "./dist/core.d.ts", default: "./dist/core.js" });
    expect(pkg.peerDependencies["@tanstack/query-core"]).toBeTruthy();
    expect(pkg.peerDependenciesMeta?.react?.optional).toBe(true);
    expect(pkg.peerDependenciesMeta?.["@tanstack/react-query"]?.optional).toBe(true);
  });

  it("./core and the root export the same API", () => {
    expect(Object.keys(core).sort()).toEqual(Object.keys(root).sort());
    expect(typeof core.a2aqTaskQueryOptions).toBe("function");
  });

  it("works against a plain @tanstack/query-core QueryClient (task, card, mutation)", async () => {
    const mock = new MockA2AAgent(echoExecutor(), { name: "plain-agent" });
    const client = new A2AQuery({ agents: { a1: { url: mock.url, fetchImpl: mock.fetchImpl } }, taskPollMs: 15 });
    const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });

    const card = await qc.fetchQuery(core.a2aqCardQueryOptions(client, "a1"));
    expect(card.name).toBe("plain-agent");

    const mut = core.a2aqSendMessageMutationOptions(client, qc, "a1");
    const sent = (await mut.mutationFn!({
      messageId: "m1",
      role: "user",
      parts: [{ content: { $case: "text", value: "hi" } }],
    } as never, {} as never)) as { taskId: string };
    const task = await qc.fetchQuery(core.a2aqTaskQueryOptions(client, "a1", sent.taskId));
    expect(task.id).toBe(sent.taskId);
  });
});

// Compile-time only (never called): the React path keeps inferring Task from the key.
export function _reactStillInfers(client: A2AQuery) {
  const r = useQuery(core.a2aqTaskQueryOptions(client, "a", "t"));
  const data: Task | undefined = r.data;
  return data;
}

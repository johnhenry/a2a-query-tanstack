import { describe, it, expect } from "vitest";
import { agentTag, cardTag, taskTag, artifactTag } from "@johnhenry/a2a-query";
import { A2A_QUERY_NS, artifactQueryKey, cardQueryKey, tagToQueryKeyPrefix, taskQueryKey } from "../src/keys.js";

describe("key builders", () => {
  it("taskQueryKey", () => {
    expect(taskQueryKey("support", "t1")).toEqual([A2A_QUERY_NS, "support", "task", "t1"]);
  });
  it("cardQueryKey", () => {
    expect(cardQueryKey("support")).toEqual([A2A_QUERY_NS, "support", "card"]);
  });
  it("artifactQueryKey nests under its task", () => {
    expect(artifactQueryKey("support", "t1", "a1")).toEqual([A2A_QUERY_NS, "support", "task", "t1", "artifact", "a1"]);
  });
});

describe("tagToQueryKeyPrefix", () => {
  it("translates agentTag to a blunt agent-wide prefix", () => {
    expect(tagToQueryKeyPrefix(agentTag("support"))).toEqual([A2A_QUERY_NS, "support"]);
  });
  it("translates cardTag", () => {
    expect(tagToQueryKeyPrefix(cardTag("support"))).toEqual([A2A_QUERY_NS, "support", "card"]);
  });
  it("translates taskTag", () => {
    expect(tagToQueryKeyPrefix(taskTag("support", "t1"))).toEqual([A2A_QUERY_NS, "support", "task", "t1"]);
  });
  it("translates artifactTag matching artifactQueryKey's own nesting", () => {
    expect(tagToQueryKeyPrefix(artifactTag("support", "t1", "a1"))).toEqual([A2A_QUERY_NS, "support", "task", "t1", "artifact", "a1"]);
  });
});

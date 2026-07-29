// queryKey construction + tag->prefix translation for a2aq. Namespaced
// agent-first (["a2aq", agent, ...]); artifacts nest under their task so a
// task-prefix invalidation also catches them.

import type { Tag } from "@johnhenry/agent-query-core";

export const A2AQ_NS = "a2aq" as const;

export function taskQueryKey(agent: string, taskId: string): readonly unknown[] {
  return [A2AQ_NS, agent, "task", taskId] as const;
}

export function cardQueryKey(agent: string): readonly unknown[] {
  return [A2AQ_NS, agent, "card"] as const;
}

export function artifactQueryKey(agent: string, taskId: string, artifactId: string): readonly unknown[] {
  return [A2AQ_NS, agent, "task", taskId, "artifact", artifactId] as const;
}

/**
 * Pure fn: a2aq Tag -> the queryKey prefix `invalidateQueries` should target.
 * For v1.1 (tag-wide invalidation of TanStack-inactive queries) — not wired
 * to anything yet; see the package README for why v1 doesn't need this at all.
 */
export function tagToQueryKeyPrefix(tag: Tag): readonly unknown[] {
  if (tag.startsWith("agent:")) return [A2AQ_NS, tag.slice("agent:".length)]; // blunt
  if (tag.startsWith("card:")) return [A2AQ_NS, tag.slice("card:".length), "card"];
  if (tag.startsWith("task:")) {
    const [, agent, taskId] = tag.split(":");
    return [A2AQ_NS, agent, "task", taskId];
  }
  if (tag.startsWith("artifact:")) {
    const [, agent, taskId, artifactId] = tag.split(":");
    return [A2AQ_NS, agent, "task", taskId, "artifact", artifactId];
  }
  return [A2AQ_NS];
}

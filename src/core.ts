// @johnhenry/a2a-query-tanstack/core — the React-free surface (depends only on
// @tanstack/query-core). The package root re-exports exactly this.

export { A2A_QUERY_NS, tagToQueryKeyPrefix, taskQueryKey, cardQueryKey, artifactQueryKey } from "./keys.js";
export { a2aqTaskQueryOptions, a2aqCardQueryOptions } from "./queryOptions.js";
export type { A2aqQueryOptions } from "./queryOptions.js";
export { a2aqSendMessageMutationOptions } from "./mutationOptions.js";
export { attachA2aqSync, ensureSynced } from "./bridge.js";

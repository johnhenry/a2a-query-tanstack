// @johnhenry/a2a-query-tanstack — TanStack Query bridge for @johnhenry/a2a-query.

export { A2A_QUERY_NS, tagToQueryKeyPrefix, taskQueryKey, cardQueryKey, artifactQueryKey } from "./keys.js";
export { a2aqTaskQueryOptions, a2aqCardQueryOptions } from "./queryOptions.js";
export { a2aqSendMessageMutationOptions } from "./mutationOptions.js";
export { attachA2aqSync, ensureSynced } from "./bridge.js";

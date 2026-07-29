// @johnhenry/a2aq-tanstack — TanStack Query bridge for @johnhenry/a2aq.

export { A2AQ_NS, tagToQueryKeyPrefix, taskQueryKey, cardQueryKey, artifactQueryKey } from "./keys.js";
export { a2aqTaskQueryOptions, a2aqCardQueryOptions } from "./queryOptions.js";
export { a2aqSendMessageMutationOptions } from "./mutationOptions.js";
export { attachA2aqSync, ensureSynced } from "./bridge.js";

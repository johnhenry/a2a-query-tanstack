# Examples

Numbered, runnable, headless — each drives a real `QueryClient` /
`MutationObserver` in Node against the in-process mock from a2a-query, no DOM
required. Run one with `npm run example:NN`, or all with `npm run examples`.

- `01-task-and-card-query.ts` — task and agent-card queries resolve through the option factories
- `02-live-sync-bridge.ts` — the sync bridge pushes live task updates into the query cache
- `03-send-message-mutation.ts` — sending a message via the mutation factory updates task state

# a2a-query-tanstack examples

Numbered, runnable, headless — each drives a real `QueryClient` /
`MutationObserver` in Node against the in-process mock agent from
`@johnhenry/a2a-query/testing`, no DOM required. Run one with
`npm run example:NN`, or all with `npm run examples`.

| Example | Demonstrates |
| --- | --- |
| [`01-task-and-card-query.ts`](./01-task-and-card-query.ts) | `a2aqTaskQueryOptions` and `a2aqCardQueryOptions` resolve real task and agent-card data through `fetchQuery`, with the first fetch routed through a2a-query's own cache rather than a bare HTTP call. |
| [`02-live-sync-bridge.ts`](./02-live-sync-bridge.ts) | Once a query is mounted, poll- and push-driven updates on a2a-query's side arrive in TanStack Query's cache via the sync bridge's `setQueryData` calls, with zero additional `queryFn` refetches. |
| [`03-send-message-mutation.ts`](./03-send-message-mutation.ts) | `a2aqSendMessageMutationOptions`'s `onSuccess` invalidates exactly one query key — the reply `TaskHandle`'s own `taskQueryKey(agent, taskId)` — and nothing else. |

## Running

```sh
npm run examples      # run all in sequence
npm run example:01    # run one
node examples/01-task-and-card-query.ts
```

## Runtime requirements (honest edition)

These examples run under plain Node >= 26 via `tsx`, no browser or bundler
needed — `QueryClient`/`MutationObserver` are what `useQuery`/`useMutation`
wrap internally, so exercising them headlessly against the in-process mock
agent covers the same factory logic a real component would hit. What they do
NOT cover: actual React rendering (`useQuery`/`useMutation` hook lifecycle,
suspense, re-render timing) — that needs a browser or `@testing-library/react`
harness, which is out of scope for a headless smoke example.

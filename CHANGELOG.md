# Changelog

## Unreleased

## 0.1.0

- **React-free entry** (johnhenry/a2a-query-tanstack#11): the factories and bridge now depend on
  `@tanstack/query-core` only; the root and a new `./core` entry export the same API without
  importing React. `@tanstack/query-core` is a required peer, `@tanstack/react-query` and `react`
  are optional peers. Option types are `QueryObserverOptions`-based (React's `UseQueryOptions` values
  remain assignable); return types are the new `A2aqQueryOptions<T>`, which still brands the key so
  `useQuery` infers the data type. Unblocks johnhenry/viaframe#546.
- Peer range for `@johnhenry/a2a-query` widened from the exact `0.0.0` to `>=0.0.0 <0.2.0`, so the
  upcoming a2a-query 0.1.0 satisfies it (publish a2a-query first).

### Added

- Numbered, runnable examples (`examples/01`–`03`, `npm run example:NN` / `npm run examples`) — headless Node runs against the in-process mock agent, matching the family's examples convention.
- README expanded: per-factory documentation, the query-key/invalidation table, and the staleness/refetch traps section.
- This changelog.

## 0.0.0 — npm scope migration (2026-08-23)

### Changed

- **Renamed from `@johnhenry/a2aq-tanstack` to `@johnhenry/a2a-query-tanstack`** as part of the agent-query family rename (npm handles now match GitHub repo names: `mcpq`/`a2aq`/`acpq` → `*-query`). The old package is unpublished; versioning restarted at `0.0.0`. The `a2aq*` symbol names (`a2aqTaskQueryOptions`, `a2aqCardQueryOptions`, `a2aqSendMessageMutationOptions`, `attachA2aqSync`) are the API's prefix, not a stale package reference, and are unchanged.
- Dependencies regenerated so `@johnhenry/a2a-query` resolves from the registry (`0.0.0` exact) instead of a local `file:..` link.

### Added

- Initial release under the new name: `queryOptions`/`mutationOptions` factories (`a2aqTaskQueryOptions`, `a2aqCardQueryOptions`, `a2aqSendMessageMutationOptions`), query-key helpers (`taskQueryKey`, `cardQueryKey`, `artifactQueryKey`, `tagToQueryKeyPrefix`), and the live sync bridge (`ensureSynced`, `attachA2aqSync`).

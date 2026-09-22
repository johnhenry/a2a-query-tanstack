# Changelog

## Unreleased

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

# Agent playbook

`@johnhenry/a2a-query-tanstack` — a thin TanStack Query bridge over
`@johnhenry/a2a-query`'s reactive cache. Single package, Node >= 26, Vitest
(`npm test`), builds to `dist/` via `tsc` (`npm run build`, only needed
before a release or a fresh-clone check — CI's `test.yml` job never builds
or type-checks; see the verification loop below). Almost every change here
touches the sync bridge (`src/bridge.ts`) or the `opts`-spreading factories
(`src/queryOptions.ts`, `src/mutationOptions.ts`) — read "How the sync
bridge works" and "Staleness and refetch traps" in the README before
editing either.

`CLAUDE.md` in this directory is a symlink to this file.

## The verification loop (before every push)

1. `npm run typecheck` — **not** run by `.github/workflows/test.yml`'s CI
   job; only `release.yml`'s publish gate runs it. Run it locally anyway —
   a type error that only surfaces at release time is a bad time to find it.
2. `npm test` — `vitest run`. Matches CI.
3. `npm run examples` — runs `example:01`–`03` in sequence against the
   in-process mock agent. CI runs this too, as the "Examples smoke test"
   step, right after `npm test`.
4. `npm run build && npm pack --dry-run` — not part of CI's `test.yml`
   either (release-only, via `release.yml`'s gate), but worth doing before
   anything that touches `src/index.ts`'s exports or `tsconfig.build.json`;
   read the file list, not just the exit code.
5. A genuinely fresh clone:
   `git clone . /tmp/a2a-query-tanstack-verifyN && cd $_ && npm ci && npm run build && npm test`.
   This is the only way to catch "works on my checked-out tree" bugs
   (missing files in `package.json`'s `files`, undeclared deps).
6. Commit, push, close the issue with a comment naming the commit SHA.

CI (`.github/workflows/test.yml`) actually runs, in order: `npm ci` →
`npm test` → `npm run examples` — no typecheck, no build. `release.yml`'s
gate runs `npm run typecheck` → `npm test` → `npm run build` before
publishing. Match whichever one is relevant to what you're verifying.

## Repo-specific gotchas

- **The `opts` spread happens before `queryKey`/`queryFn` are set, not
  after.** Every factory in `src/queryOptions.ts` and
  `src/mutationOptions.ts` spreads the caller's `opts` first, then
  overwrites `queryKey` and `queryFn` with its own. A custom `queryFn` or
  `queryKey` passed in `opts` is silently discarded — no error, no
  TypeScript complaint, it just never runs. Everything else (`staleTime`,
  `gcTime`, `enabled`, `select`, …) passes through untouched.
- **Default `staleTime: 0` turns every remount/focus into a wasted
  refetch.** Freshness is a2a-query's job (polling, push, optimistic
  patches) and arrives through the sync bridge's `setQueryData` calls, not
  through TanStack's own refetching. Without an explicit `staleTime:
  Infinity` on bridged queries, TanStack's default re-runs the `queryFn` on
  every remount and window focus — served from a2a-query's cache (cheap),
  except `a2aqCardQueryOptions({ refresh: true })`, where each of those
  re-runs is a real network call.
- **`gcTime` controls bridge teardown, not data freshness.** When TanStack
  garbage-collects a query nobody renders (`QueryCache` `'removed'` event),
  `src/bridge.ts`'s listener releases the matching a2a-query-side
  `cache.subscribe()` ref. An aggressive `gcTime` just means more
  unmount → gc → remount → re-register cycles, each costing one `queryFn`
  pass through a2a-query's own cache — not a data-staleness bug, but worth
  knowing before tuning `gcTime` down to "fix" something else.

## Definition of done

A change is done when all of the following hold, not just when tests pass:
- A regression test exists for any bug fixed — fixing a bug without a test
  that would have caught it means it can come back unnoticed.
- Anything the feature does **not** do is stated in the README's "Honest
  limitations" section, not only in an issue comment.
- `CHANGELOG.md` has an entry citing the commit/PR.
- `examples/README.md`'s table is updated if `examples/` gained, lost, or
  changed the behavior of a numbered example.

## Releases

Bump `version` in `package.json` in a PR, add the `CHANGELOG.md` entry,
merge, then push a `v<version>` tag (or run `release.yml` via
`workflow_dispatch`) — `.github/workflows/release.yml` gates on
`typecheck` + `test` + `build`, verifies the tag matches `package.json`'s
version, then publishes idempotently (skips if that version is already on
npm) with `--provenance --access public --tag rc`. First and subsequent
publishes intentionally use the `rc` dist-tag, not `latest` — see the
comment block at the top of `release.yml` for why.

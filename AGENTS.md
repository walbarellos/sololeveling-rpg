# AGENTS.md — RPG Web Foundation

## Mission
Build a browser-based 2D top-down/isometric-capable shared-world RPG with hybrid persistence:
- Persistent world state: characters, inventory, guilds, reputation, regional state.
- Instanced state: combat encounters, dungeons, Gates, and Tower runs.
- Server authority: the server validates movement, combat, rewards, cooldowns, and persistence.
- Client presentation: rendering and animation never decide game outcomes.

## Architecture decisions (ADRs)
1. TypeScript across client, server, and shared contracts.
2. npm workspaces monorepo; modular monolith first, no premature microservices.
3. NestJS + Socket.IO for authoritative realtime server; Vite + Phaser for 2D rendering.
4. PostgreSQL is the intended durable store. The first vertical slice uses in-memory state behind a repository boundary and is explicitly non-persistent across server restarts.
5. Zod schemas in `packages/contracts` are the runtime validation source of truth for client/server messages.
6. All gameplay time is injected through a `Clock` abstraction. Avoid direct wall-clock reads in domain rules.
7. Server simulation tick is independent of client frame rate. Client predicts presentation only; server state is authoritative.
8. Every reward claim must eventually be idempotent, keyed by a unique operation/idempotency key.
9. No generated content enters the game without schema validation and balance constraints.
10. Avoid external asset dependencies in the first vertical slice; placeholder graphics are intentional.

## Agent task protocol
Every task must specify:
- Goal and non-goals
- Allowed files/directories
- Contract(s) consumed or changed
- Acceptance criteria with executable tests
- Migration/compatibility impact
- Performance/security risks

## File ownership
- `packages/contracts/**`: contract/schema agent only. Notify client/server owners of changes.
- `apps/server/src/domain/**`: domain agent.
- `apps/server/src/realtime/**`: realtime agent.
- `apps/client/src/**`: client/presentation agent.
- `.github/workflows/**`, root package files: foundation/CI agent.
- Do not let two agents edit the same files in parallel. Use separate git worktrees and disjoint file ownership.

## Required checks before merge
- `npm run typecheck`
- `npm run test`
- `npm run build`
- Contract changes must include validation tests.
- Gameplay changes must include domain tests or a documented reason they cannot.
- Do not merge a branch with failing checks, unexplained test skips, or generated files accidentally committed.

## Coding rules
- Strict TypeScript; avoid `any`. If unavoidable, explain why and narrow immediately.
- Validate all network input at runtime. TypeScript types do not validate untrusted JSON.
- Use stable IDs; never trust client-supplied player identity, damage, position, item ownership, or rewards.
- Keep pure domain logic free of NestJS, Phaser, database, and transport imports.
- Keep event names and payloads in `packages/contracts`; no ad-hoc event strings.
- Errors are structured and do not leak secrets or stack traces to clients.
- Use UTC timestamps in ISO-8601 when timestamps are needed; prefer server sequence numbers for ordering.
- Avoid per-frame network messages. Send input intent and state/events at bounded rates.
- Effects are cosmetic. A visual hit effect must not apply damage or grant rewards.
- Respect reduced-motion preference and provide scalable effects quality.
- No credentials, `.env` files, user data, or production secrets in commits.

## Gameplay and security invariants
- Movement is server-validated against speed and elapsed simulation time.
- Combat range, cooldown, alive state, and target validity are checked on the server.
- Reward application must be atomic and idempotent when persistence is introduced.
- Client may request an action, never assert its result.
- Disconnects must not erase persistent character state.
- PvP requires explicit server-side rules for safe zones, consent/flags, level differences, and combat logging before public release.

## Definition of done
A change is done only when contracts, implementation, tests, documentation, and observability are updated together. The first slice is a scaffold, not a production-ready MMO.

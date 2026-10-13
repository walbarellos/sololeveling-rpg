# AGENTS.md — Hunter RPG Web Foundation (Tiles & Turnos)

## Read order (token budget)
1. This file (~7.5 KB). 2. [docs/INDEX.md](docs/INDEX.md) routes the task. 3. Open only the files the route names. Prefer `grep -n` + a line range over reading whole files.

| Task | Read only |
|---|---|
| Add/change a socket event | [docs/protocol.md](docs/protocol.md), then the one schema in `packages/contracts/src` |
| Change a rule, number or formula | [docs/domain-map.md](docs/domain-map.md) (constants table), then the named service |
| Rank exams / progression | `packages/contracts/src/progression.ts`, `academy.ts`, `apps/server/src/domain/academy.service.ts` |
| Items / loot / drops | `packages/contracts/src/items.ts`, `loot.service.ts`; `grep` the `*.data.ts` catalogs |
| New gate/world/map | `apps/server/src/domain/worlds.ts`, `docs/domain-map.md#mundos-zonas-npcs-classes` |
| UI / presentation | `apps/client/src/ui/<screen>.controller.ts` + `styles/<screen>.css` |
| Persistence / SQL | `PlayerRepository` in `player.repository.ts`; `docs/schemas/schema.sql` is **stale** |

## Commands
`npm install` · `npm run dev:server` · `npm run dev:client` · `npm run typecheck` · `npm run test` · `npm run build` (declared in README/this file; the source zip had no `package.json`, so they were not executed during the docs pass).

## Do not read (noise or generated)
`node_modules/`, `dist/`, `coverage/`, `apps/client/public/assets/**` (binary art), `apps/server/src/domain/items.data.ts` and `items-high-tier.data.ts` (catalogs, ~41 KB + ~17 KB; `grep` by id), `apps/client/src/{assets,terrain,avatars,skillicons}.ts` (art data; only for visual tasks), `docs/schemas/schema.sql` and `world.example.json` (first-slice snapshots, out of date).

## Context traps (code contradicts older prose)
- Ranks are `E…SSS+` (9), not "E–S"; `MAX_LEVEL` is 200. Source: `packages/contracts/src/{base,progression}.ts`.
- Grid of gate E is 48×28, not 20×12; respawn is 18 s. Source: `apps/server/src/domain/game.service.ts`.
- Outside `NODE_ENV=test` new players are seeded at Lv 100 / rank S / 100k gold; run domain tests with `NODE_ENV=test`.
- `game:dev:set-level` is registered without environment gating. Treat it as a known violation of the invariants below until it is gated or removed.
- Two combat paths exist: legacy `game:attack` and turn-based `BattleSession`. ADR 4 describes only the first.
Full list with file/line links: [docs/domain-map.md](docs/domain-map.md#lacunas-e-riscos-verificados). Event catalogue: [docs/protocol.md](docs/protocol.md).

## Mission
Build a browser-based 2D grid/tile-based shared-world Hunter RPG with hybrid persistence and discrete turn-based mechanics:
- References: Naruto Game (grid exploration, discrete steps, action cooldowns, turn-based combat) and Solo Leveling (Hunter Ranks E–S, Gates, 100-floor Tower, Shadow summons).
- Persistent world state: characters, inventory, guilds, reputation, regional Gate instability.
- Instanced state: combat encounters, Gate dungeons, and Tower runs.
- Server authority: the server validates discrete movement, obstacles, turn-based combat, rewards, cooldowns, and persistence.
- Client presentation: Phaser handles smooth visual interpolation (tweens) and VFX; rendering never decides game outcomes.

## Architecture decisions (ADRs)
1. TypeScript across client, server, and shared contracts in an npm workspaces monorepo.
2. Grid & Tiles: Game world is strictly modeled as integer tile coordinates (`TileCoord { x, y }`). Movement is directional steps (`UP`, `DOWN`, `LEFT`, `RIGHT`) bounded by map limits and obstacle sets.
3. Anti-Speedhack by Discrete Rate Limit: Anti-cheat does not rely on floating-point velocity integration. Steps are rejected if `now - lastStepAt < STEP_COOLDOWN_MS`.
4. Turn-Based & Adjacent Combat: Combat actions require Chebyshev adjacency ($\max(|dx|, |dy|) \le 1$). Attacks resolve with deterministic damage, enemy counter-attack retaliation, and action cooldowns.
5. Lazy World Simulation: Living world mechanics (Gate outbreaks, threat levels, NPC routines) use timestamp-based lazy evaluation (`elapsed = now - lastEvaluatedAt`) upon region access, consuming zero idle server CPU.
6. Repository Pattern for Persistence: `PlayerRepository` provides a clean boundary. In-memory storage is used for unit tests/scaffolding, while PostgreSQL is the durable production store.
7. Zod schemas in `packages/contracts` are the runtime validation source of truth for client/server messages.
8. Injectable `Clock` abstraction in domain logic; no direct wall-clock reads.
9. Presentation Separation: Client animates smooth tweens between tiles, floating combat text, and screen shake, but cannot assert state changes.
10. Idempotent Rewards: Every reward claim must be keyed by an idempotency key.
11. Server-owned Progression: EXP, levels, rank caps and stat scaling are computed on the server from `packages/contracts/src/progression.ts`. The client never sends or computes rewards; it renders `BattleSnapshot.rewards`.
12. Stable Identity (demo): the handshake `playerKey` is hashed server-side into `playerId`; replace with real authentication before any public exposure.
13. Ordered Combat Events: turn outcomes are sent as `BattleSnapshot.events` (with `logIndex`) so the client can present them in order; the client must not infer outcomes from log strings.

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
- Strict TypeScript; avoid `any`.
- Validate all network input at runtime using Zod schemas.
- Use stable IDs; never trust client-supplied player identity, damage, position, or rewards.
- Keep pure domain logic free of NestJS, Phaser, database, and transport imports.
- Keep event names and payloads in `packages/contracts`; no ad-hoc event strings.
- Errors are structured with explicit codes (`"OUT_OF_BOUNDS"`, `"OBSTACLE"`, `"TOO_FAST"`, `"TARGET_UNAVAILABLE"`, `"TOO_FAR"`, `"COOLDOWN"`).
- Use UTC timestamps in ISO-8601 when timestamps are needed; prefer server sequence numbers for ordering.
- Respect reduced-motion preference and provide scalable effects quality.
- No credentials, `.env` files, user data, or production secrets in commits.

## Gameplay and security invariants
- Step movement is server-validated against grid bounds, obstacles, and cooldown.
- Combat range (adjacency), cooldown, alive state, and target validity are checked on the server.
- Reward application must be atomic and idempotent.
- Client may request an action, never assert its result.
- Disconnects must not erase persistent character state.

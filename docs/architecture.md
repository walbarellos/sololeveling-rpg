# Architecture overview

## Runtime boundaries
- Client: input intent, interpolation, rendering, effects, UI and audio.
- Server: identity binding, input validation, authoritative movement/combat, world snapshots.
- Contracts: runtime schemas and event names shared by both sides.
- Domain: transport-independent gameplay rules.
- Persistence (next increment): PostgreSQL repository interfaces and migrations.

## First vertical slice
1. Socket connects; server assigns a temporary socket identity.
2. Server emits `game:welcome` with world dimensions.
3. Client requests/receives a validated snapshot.
4. Click requests movement; server bounds-checks and caps movement distance.
5. Click a slime requests attack; server validates target, range and cooldown.
6. Server emits combat log and updated world snapshot.

## Event envelope evolution
The current slice uses small direct payloads for simplicity. Before adding public multiplayer features, migrate to a versioned envelope:
`{ schemaVersion: 1, eventId, sequence, occurredAt, payload }`.
Use sequence numbers for ordering; timestamps are observability metadata, not a trusted source of game logic.

## Production blockers
Authentication, durable persistence, database transactions, collision map, fixed tick, rate limiting, anti-cheat telemetry, instance lifecycle, reconnect semantics, load tests, backups, moderation/reporting, and PvP policy.

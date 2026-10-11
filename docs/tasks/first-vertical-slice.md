# Task card: First vertical slice

## Goal
Prove one end-to-end authoritative loop: connect, observe, move, attack, receive combat result.

## Allowed files
- `apps/server/src/domain/**`
- `apps/server/src/realtime/**`
- `apps/client/src/**`
- `packages/contracts/**` only when coordinating a contract change

## Acceptance criteria
- Invalid payloads are rejected by runtime schema validation.
- Client cannot set its own player ID, HP, damage, enemy HP, or rewards.
- Movement is clamped to world bounds and capped by server-side speed logic.
- Attack is rejected when target is missing/dead, too far away, or cooldown is active.
- Combat log is emitted only after the server applies damage.
- Client renders snapshots and treats server values as authoritative.
- `npm run typecheck`, `npm test`, and `npm run build` pass.

## Non-goals
Authentication, durable persistence, collision maps, guilds, PvP, production scale, final art.

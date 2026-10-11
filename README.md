# RPG Web Foundation

Runnable foundation for a shared-world 2D browser RPG. The first vertical slice includes:
- Vite + Phaser client with a small top-down arena.
- NestJS + Socket.IO server.
- Shared Zod contracts.
- Server-authoritative movement and basic attack.
- In-memory demo world; state resets on server restart.
- CI for install, typecheck, tests, and builds.

## Requirements
- Node.js 20.11+
- npm 10+

## Run locally
In terminal 1:
```bash
npm install
npm run dev:server
```
In terminal 2:
```bash
npm run dev:client
```
Open the Vite URL, normally `http://localhost:5173`. Open a second browser tab to observe separate demo players.

## Controls
- Click the arena to request movement.
- Click an enemy to request an attack (server validates range and cooldown).
- This is a vertical-slice prototype, not a secure public MMO.

## Important limitations
- No authentication: the server assigns a demo identity per socket. Do not expose publicly.
- No durable persistence, database migrations, guilds, PvP, anti-cheat telemetry, or production deployment yet.
- In-memory world resets on restart.
- Movement uses server-side bounds and speed validation, but production movement should use fixed simulation ticks, collision maps, and rate limits.
- The placeholder shapes are intentional; asset pipeline and animation states are later increments.

## Next increments
1. Add PostgreSQL repository + migrations and transactional idempotent reward claims.
2. Add authentication/session binding and rate limits.
3. Add collision/map schema and server-side collision validation.
4. Add fixed-tick simulation and snapshot interpolation.
5. Add instanced Gate/Tower lifecycle and persistent region events.
6. Add guilds/PvP only after authorization and abuse rules are defined.

# RPG Web Foundation

Runnable foundation for a shared-world 2D browser RPG. The first vertical slice includes:
- Vite + Phaser client with a small top-down arena.
- NestJS + Socket.IO server.
- Shared Zod contracts.
- Server-authoritative movement and basic attack.
- In-memory demo world; state resets on server restart.
- CI for install, typecheck, tests, and builds.
- **Documentação completa de princípios OOP, Design Patterns e SOLID disponível em `docs/`**

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
- Click the arena to request movement; WASD/arrows step; `E` fights the adjacent (or nearest) monster.
- In battle: `1`/`2`/`3` use skills, `F` flees.
- This is a vertical-slice prototype, not a secure public MMO.

## Progression (EXP, levels, rank caps)
- EXP is applied **server-side** on battle end (`GameService.grantExp`); the client only displays `BattleSnapshot.rewards`.
- Formulas live in `packages/contracts/src/progression.ts` (`expToNext`, `mobExp`, `statMult`, `RANK_CAP`). Values are a starting point for tuning, not final balance.
- Level is capped per rank (E: 12, D: 25, C: 40, B: 60, A: 80, S: 100). At the cap, EXP is held back until a rank trial exists (not implemented yet: rank is always E).
- Level-up scales max HP/MP and skill damage/heal (`1 + 0.09 * (level - 1)`) and restores HP/MP. Monster damage scales with the monster level.
- Victory gives full EXP, a mutual-KO draw gives half, defeat/flee give none.
- Monsters respawn lazily 30 s after death (evaluated on world reads, no timers).

## Identity
- The client keeps a random key in `localStorage` and sends it in the Socket.IO handshake; the server exposes only its SHA-256 prefix as `playerId`. Refreshing the page keeps your hunter.
- Open `?slot=2` (3, 4...) for a second local hunter. Opening the same slot in a second tab replaces the first connection.
- Offline hunters are kept in the repository but are not part of the world snapshot.
- Still demo-grade: no real authentication, and the in-memory repository resets on server restart.

## Battle presentation
- `BattleSnapshot.events` carries the last turn as ordered events (hit, crit, block, dodge, heal, death) with a `logIndex` into `log`. The client replays them (floating numbers, hit flash, screen shake, death animation) before showing the result screen. Click or press any key to skip.
- The HUD is frozen during the sequence so EXP is not spoiled. `prefers-reduced-motion` disables the animations.

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

## Documentação Estruturada
Este projeto aplicou os seguintes princípios de engenharia de software, com análise detalhada disponível em `docs/`:

- **Abstração** - Interface `Clock`/`PlayerRepository`, Zod schemas como fonte de verdade
- **Encapsulamento** - `private` em toda lógica crítica, `public` apenas API intencional
- **Herança** - Uso limitado; preferência por composição (`BattleEngineDependencies`)
- **Polimorfismo** - Através de interfaces + type discriminants (`Clock`, `PlayerRepository`)
- **Composição sobre Herança** - `BattleEngineDependencies`, `CLASS_STATS` registry, `SystemClock implements Clock`
- **SOLID** - SRP (cada serviço foco único), OCP (nova classe = adicionar ao `CLASS_STATS`), LSP (`Clock` ↔ `SystemClock`), ISP (interfaces pequenas), DIP (injeção de dependência abstrata)
- **DRY** - `statMult`, `expToNext`, `mobExp` usadas em todo o código
- **KISS** - Regras diretas, códigos de erro enumerados, events versionados
- **YAGNI** - Nenhuma feature antecipada; constants demo isolados; RNG plugável
- **Design Patterns** - Repository, Strategy, DI, Service, Observer, Adapter, Facade
- **Modularidade** - `packages/contracts/` isolado, workspaces separando concerns
- **Reutilização** - Funções puas compartilhadas (`statMult`, `expToNext`, `mobExp`)
- **Generics e Tipagem** - `Map<string, EnemySnapshot>`, TypeScript strict, zero `any`
- **Imutabilidade** - Funções puras em `progression.ts`, `skills.data.ts`; mutação controlada no game loop
- **Lei de Demeter** - Violções moderadas no client `world.scene.ts`; métodos seletores recomendados
- **Tell Don't Ask** - Lógica internalizada em `battle-engine.service`; queries no client ainda presentes
- **Sobrecarga** - Não utilizada; optional parameters no lugar de TypeScript overloads
- **Classes Abstratas** - Não usadas; abstração via interfaces + classes concretas
- **Métodos Virtuais** - Por polimorfismo de interface (não keyword `virtual` em TS)
- **Alta Coesão** - Cada classe foco em domínio específico (battle, inventory, academy, etc.)
- **Baixo Acoplamento** - `contracts/` isolado, interfaces para implementações, DI em todo lado

## FAQ - Perguntas Frequentes
Confira o arquivo `docs/FAQ.md` para respostas rápidas sobre:
- Como funciona o combate
- Como subir de nível
- Como me mover
- Como funcionam as batalhas
- O que são os Gates
- Como salvamento funciona
- Identidade no jogo
- Próximos incrementos

## Rodar o Servidor
```bash
npm run dev:server
```

## Rodar o Cliente
```bash
npm run dev:client
```

Open `http://localhost:5173` no navegador.

---

## 📦 Links Rápidos

[![GitHub Stars](https://img.shields.io/github/stars/walbarellos/sololeveling-rpg?style=for-the-badge)](https://github.com/walbarellos/sololeveling-rpg/stargazers)
[![GitHub Forks](https://img.shields.io/github/forks/walbarellos/sololeveling-rpg?style=for-the-badge)](https://github.com/walbarellos/sololeveling-rpg/forks)
[![GitHub Issues](https://img.shields.io/github/issues/walbarellos/sololeveling-rpg?style=for-the-badge)](https://github.com/walbarellos/sololeveling-rpg/issues)
[![GitHub License](https://img.shields.io/github/license/walbarellos/sololeveling-rpg?style=for-the-badge)](https://github.com/walbarellos/sololeveling-rpg/blob/main/LICENSE)
[![TypeScript](https://img.shields.io/badge/typecheck-passed-blue?style=for-the-badge)](https://github.com/walbarellos/sololeveling-rpg/blob/main/package.json)
[![License: MIT](https://img.shields.io/badge/license-MIT-green?style=for-the-badge)](https://github.com/walbarellos/sololeveling-rpg/blob/main/LICENSE)

## 📫 Contato

[GitHub](https://github.com/walbarellos) • [LinkedIn](https://linkedin.com/in/willian-albarello) • Twitter: @walbarellos

---

AUTHOR: WILLIAN ALBARELLO @walbarellos

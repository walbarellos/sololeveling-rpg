# Mapa de domínio (o que existe, onde, e como está hoje)

> Escopo: estado real do código em 2026-10-12 (zip enviado, sem histórico git). Quando README/`architecture.md` divergirem, vale este arquivo; quando este divergir do código, vale o código. Números só aparecem aqui se foram lidos do fonte.

## Serviços do servidor ([apps/server/src/domain](../apps/server/src/domain))
| Arquivo | Linhas | Responsabilidade |
|---|---|---|
| [game.service.ts](../apps/server/src/domain/game.service.ts) | 998 | Orquestrador: conexão, passo, ataque legado, missões, inventário, teleporte, snapshot; instancia os demais serviços no construtor. · testes: [game.service.spec.ts](../apps/server/src/domain/game.service.spec.ts), [progression.spec.ts](../apps/server/src/domain/progression.spec.ts), [missions.spec.ts](../apps/server/src/domain/missions.spec.ts), [attributes.spec.ts](../apps/server/src/domain/attributes.spec.ts) |
| [battle-engine.service.ts](../apps/server/src/domain/battle-engine.service.ts) | 363 | Ciclo da batalha: `startBattle`, `executeBattleAction`, `useCombatConsumable`, `fleeBattle`, `resolveBattleEnd`. Sem spec próprio (coberto via `GameService`). |
| [battle.session.ts](../apps/server/src/domain/battle.session.ts) | 426 | Uma batalha em andamento: `executeAction`, `executeConsumable`, `flee`, `toSnapshot`; RNG injetável (`RngFn`), fixo em 0.99 com `NODE_ENV=test`. · testes: [progression.spec.ts](../apps/server/src/domain/progression.spec.ts), [items-academy.spec.ts](../apps/server/src/domain/items-academy.spec.ts) |
| [boss.service.ts](../apps/server/src/domain/boss.service.ts) | 416 | Chefes (`WorldBossState`, `initBosses`), revive/reset, `updateBossHp` (devolve o anúncio de gate clear ao derrotar). · testes: [boss-loot.spec.ts](../apps/server/src/domain/boss-loot.spec.ts), [items-academy.spec.ts](../apps/server/src/domain/items-academy.spec.ts) |
| [loot.service.ts](../apps/server/src/domain/loot.service.ts) | 197 | `rollMonsterDrop`, `addItemToInventory`, `recordItemDrop`, `createStartingInventory`. · testes: [boss-loot.spec.ts](../apps/server/src/domain/boss-loot.spec.ts), [items-academy.spec.ts](../apps/server/src/domain/items-academy.spec.ts) |
| [inventory.service.ts](../apps/server/src/domain/inventory.service.ts) | 227 | Equipar/desequipar/usar/vender itens. · testes: [boss-loot.spec.ts](../apps/server/src/domain/boss-loot.spec.ts), [items-academy.spec.ts](../apps/server/src/domain/items-academy.spec.ts) |
| [academy.service.ts](../apps/server/src/domain/academy.service.ts) | 144 | Exames de rank (`evaluatePromotion`). · testes: [items-academy.spec.ts](../apps/server/src/domain/items-academy.spec.ts) |
| [missions.service.ts](../apps/server/src/domain/missions.service.ts) | 183 | Missões cronometradas. · testes: [missions.spec.ts](../apps/server/src/domain/missions.spec.ts) |
| [teleport.service.ts](../apps/server/src/domain/teleport.service.ts) | 145 | `teleportPlayerToZone` e `interactWithShrine`. Sem spec próprio. |
| [player.repository.ts](../apps/server/src/domain/player.repository.ts) | 128 | `PlayerRepository` + `InMemoryPlayerRepository` (única implementação; token `PLAYER_REPOSITORY`). |
| [clock.ts](../apps/server/src/domain/clock.ts) | 11 | `Clock` injetável (token `CLOCK`). |
| [worlds.ts](../apps/server/src/domain/worlds.ts) | 280 | Geometria dos gates D–SSS (limites, spawn, obstáculos, portal do chefe, altares). |
| [skills.data.ts](../apps/server/src/domain/skills.data.ts) | 293 | `CLASS_STATS`, `calculatePlayerStats/MaxHp/MaxMp`, soma de bônus de equipamento. · testes: [attributes.spec.ts](../apps/server/src/domain/attributes.spec.ts) |
| [enemies.data.ts](../apps/server/src/domain/enemies.data.ts) | 219 | `MOB_TEMPLATES`, `DEFAULT_OBSTACLES`, `createInitialEnemies`. |
| [items.data.ts](../apps/server/src/domain/items.data.ts) | 947 | `MASTER_ITEMS` e `RARITY_DROP_POOL` (arquivo grande: ~41 KB; leia por `grep`, não inteiro). |
| [items-high-tier.data.ts](../apps/server/src/domain/items-high-tier.data.ts) | 316 | `HIGH_TIER_ITEMS` (IMMORTAL / COSMIC / DIVINE, níveis 100–250+). |

## Constantes que mandam (leia daqui, não da prosa)
| Constante | Valor | Fonte |
|---|---|---|
| `STEP_COOLDOWN_MS` | 200 | [game.service.ts:76](../apps/server/src/domain/game.service.ts#L76) |
| `ATTACK_COOLDOWN_MS` | 600 | [game.service.ts:77](../apps/server/src/domain/game.service.ts#L77) |
| `PLAYER_ATTACK_DAMAGE` (ataque legado) | 30 | [game.service.ts:78](../apps/server/src/domain/game.service.ts#L78) |
| `ENEMY_RESPAWN_MS` (respawn lazy) | 18 000 | [game.service.ts:80](../apps/server/src/domain/game.service.ts#L80) |
| Grade do gate E (`GRID_WIDTH`×`GRID_HEIGHT`, `TILE_SIZE`) | 48×28, 48 px | [game.service.ts:73](../apps/server/src/domain/game.service.ts#L73) |
| `MAX_LEVEL` | 200 | [progression.ts:7](../packages/contracts/src/progression.ts#L7) |
| `STARTING_STAT_POINTS` / `STAT_POINTS_PER_LEVEL` | 5 / 3 | [base.ts:37](../packages/contracts/src/base.ts#L37) |

## Progressão ([progression.ts](../packages/contracts/src/progression.ts))
- `expToNext(l) = round(40·l^1.5)`; `mobExp(l) = round(8·l^1.1)`; `statMult(l) = 1 + 0.09·(l−1)`.
- Valores calculados: `expToNext` 1→40, 10→1 265, 50→14 142, 100→40 000, 200→113 137; `mobExp` 1→8, 50→592, 200→2 718; `statMult(100)` = 9,91.
- Teto de nível por rank (`RANK_CAP`, [progression.ts:10](../packages/contracts/src/progression.ts#L10)): E 12 · D 25 · C 45 · B 65 · A 90 · S 120 · SS 150 · SSS 180 · SSS+ 200. No teto o EXP fica retido até passar no exame.
- Ranks ([base.ts](../packages/contracts/src/base.ts)): `E, D, C, B, A, S, SS, SSS, SSS+` (9 valores; README e AGENTS antigos falam em "E–S").

## Academia (exames de rank)
Fonte: [RANK_EXAM_REQUIREMENTS](../packages/contracts/src/academy.ts#L26); execução: [academy.service.ts](../apps/server/src/domain/academy.service.ts). Ordem de checagem: nível mínimo → pontos de atributo **alocados** (soma de `str/agi/vit/int − 10`) → troféu no inventário.

| Alvo | Nível recomendado | Mín. atributos alocados | Troféu exigido | Bônus | Novo teto |
|---|---|---|---|---|---|
| D | 8 | 15 | `trophy_goblin_boss_core` (Núcleo de Mana do Chefe Goblin) | +10 | 25 |
| C | 15 | 30 | `trophy_crimson_heart` (Coração da Cidadela Carmesim) | +15 | 45 |
| B | 25 | 50 | `trophy_frost_queen_crystal` (Cristal do Coração da Rainha do Gelo) | +25 | 65 |
| A | 45 | 75 | `trophy_shadow_lich_skull` (Crânio do Arquilorde Necromante) | +35 | 90 |
| S | 65 | 100 | `trophy_dragon_heart` (Coração Vulcânico do Dragão Ignis) | +50 | 120 |
| SS | 95 | 130 | `trophy_god_statue_fragment` (Fragmento Sagrado da Estátua de Deus) | +75 | 150 |
| SSS | 125 | 160 | `trophy_cosmic_core` (Núcleo da Calamidade Cósmica) | +100 | 180 |

`SSS+` **não tem exame** (`RANK_EXAM_REQUIREMENTS` não o define): a resposta é "A Associação ainda não liberou exames", logo o teto 200 só é alcançável via `game:dev:set-level`.

## Mundos, zonas, NPCs, classes
- Mundos (`WorldId`): `GATE_E, D, C, B, A, S, SS, SSS`. Tamanhos em [worlds.ts](../apps/server/src/domain/worlds.ts): D 44×26 · C 48×28 · B 52×30 · A 56×32 · S 60×34 · SS 64×36 · SSS 68×38 (E usa a grade de `game.service.ts`).
- Zonas de teleporte: `SANTUARIO, CATACUMBAS, COVIL, ABISMO, CHAMBER, ENTER_GATE_D…SSS, RETURN_GATE_E` ([ZoneTeleportRequestSchema](../packages/contracts/src/index.ts#L314)).
- NPCs (`WORLD_NPCS`, [index.ts](../packages/contracts/src/index.ts#L284)): `npc_baek` (Inspetor Baek, ACADEMY), `npc_merchant` (Mercador Kim, MERCHANT), `npc_gatekeeper` (Operador Jin, GATEKEEPER).
- Classes: `WARRIOR, ASSASSIN, MAGE, BATTLE_HEALER` (padrão ao criar: `BATTLE_HEALER`).
- Catálogos: 43 `MOB_TEMPLATES`, 176 + 56 entradas de itens (`items.data.ts` + `items-high-tier.data.ts`; contagem por padrão de chave, aproximada), 11 `MISSIONS` ([missions.ts](../packages/contracts/src/missions.ts#L83)).

## Cliente ([apps/client/src](../apps/client/src))
Phaser + Vite. Entrada [main.ts](../apps/client/src/main.ts); socket único [game-socket.ts](../apps/client/src/network/game-socket.ts); estado [game-state.ts](../apps/client/src/state/game-state.ts). Cena do mundo [world.scene.ts](../apps/client/src/scenes/world.scene.ts) (~30 KB) e [world-objects.manager.ts](../apps/client/src/scenes/world-objects.manager.ts); batalha [battle.controller.ts](../apps/client/src/battle/battle.controller.ts); UI em `ui/*.controller.ts` (hud, profile, inventory, academy, missions, npc, modals); CSS por tela em `styles/`. `assets.ts`, `terrain.ts`, `avatars.ts`, `skillicons.ts` são dados/geração de arte (grandes; só abra se a tarefa for visual). Binários em `apps/client/public/assets/` (retratos, itens, spritesheet): **nunca leia**.

## Lacunas e riscos verificados
1. **`game:dev:set-level` sem gating**: o handler ([game.gateway.ts:518](../apps/server/src/realtime/game.gateway.ts#L518)) e [GameService.devSetLevel](../apps/server/src/domain/game.service.ts#L321) não checam ambiente; qualquer cliente conectado pode setar nível (até 250, acima de `MAX_LEVEL` 200), rank, pontos e ouro. Contraria o invariante "cliente nunca afirma resultado" de [AGENTS.md](../AGENTS.md#gameplay-and-security-invariants). Correção sugerida: registrar o handler só quando `NODE_ENV !== "production"` ou remover.
2. **Semente de demonstração fora de `NODE_ENV=test`**: todo jogador novo começa Nv 100, rank S, 450 pontos, 100 000 de ouro e 10 itens épicos+ ([game.service.ts:83](../apps/server/src/domain/game.service.ts#L83), [:244](../apps/server/src/domain/game.service.ts#L244), [:274](../apps/server/src/domain/game.service.ts#L274)); jogadores existentes são promovidos a isso na reconexão. README antigo dizia "Nv 1, rank E". Qualquer teste de progressão real precisa de `NODE_ENV=test`.
3. **`docs/schemas/schema.sql` desatualizado**: `rank` limitado a `E–S` (código tem 9), sem colunas de ouro, atributos, inventário, equipamento ou missões; nenhum código usa PostgreSQL ainda (só `InMemoryPlayerRepository`). [world.example.json](schemas/world.example.json) também reflete o primeiro slice (campo `stamina`, 2 slimes) e não o `WorldSnapshot` atual.
4. **Dois caminhos de combate** coexistem: ataque direto `game:attack` e `BattleSession`; ADR 4 descreve só o primeiro.
5. **Ausentes do zip enviado**: `package.json` (raiz e workspaces), `.github/workflows`, configs de Vite/tsconfig raiz, `LICENSE`. Os comandos npm de README/AGENTS não puderam ser executados aqui; a contagem de testes (85 chamadas `it()`: contratos 24, `game.service` 16, `progression` 11, `missions` 10, `items-academy` 9, `attributes` 6, `boss-loot` 6, `identity` 3) é estática, não de execução.

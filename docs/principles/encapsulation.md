---
title: "Princípio do Encapsulamento"
tags: ["encapsulation", "private", "design-patterns"]
conformidade: "95"
author: "Willian Albarello"
date: "2026-10-12"
---
# Princípio do Encapsulamento

## ✨ Resumo Rápido (3 linhas)

- **Conceito**: Ocultar o estado interno dos objetos e expor apenas o necessário.
- **Conformidade**: ⭐⭐⭐⭐⭐ (95%).
- **Evidência**: `game.service.ts:113` - `private obstacleSet`.

## No Projeto

- `GameService`: `private obstacleSet`, `private enemies`, `private online`, `private diedAt`, `private sequence`, `private worlds` (`game.service.ts:113-126`).
- `InMemoryPlayerRepository`: `private readonly store = new Map` (`player.repository.ts:78`).
- `BattleSession`: `private skillDefs`, `private enemyDamageBase`, `private rng` (`battle.session.ts:36-47`).
- `BattleEngineService`: `private battleCounter = 0` (`battle-engine.service.ts:36`).
- `WorldScene` (cliente): `playerGraphics`, `enemyGraphics`, `terrainImage`, etc. (`world.scene.ts:58-68`).

## Acesso Público Intencional

- `GameService`: `public readonly bossService`, `battleEngineService`, `teleportService`.
- `BattleEngineService`: `public readonly activeBattles = new Map`.
- `WorldObjectsManager`: `public portalObjects`, `npcObjects`, `currentPortais`, `shrineObjects`.

## Ausência de `protected`

- **Nenhum `protected` encontrado** em todo o código-base - preferência por composição sobre herança.

## Referências

- `apps/server/src/domain/game.service.ts:113-126`
- `player.repository.ts:78`
- `battle.session.ts:36-47`
- `world.scene.ts:58-68`
---
## 📌 Âncora de Navegação

[[principio-encapsulamento]]

### Referências Cruzadas

- **SOLID: I (Interface Segregation)** -Interfaces pequenas e focadas.
- **Conformidade**: 95% - encapsulamento forte em toda lógica crítica.

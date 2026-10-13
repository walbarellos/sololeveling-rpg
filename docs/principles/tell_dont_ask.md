---
title: "Tell Don't Ask"
tags: ["tell-dont-ask", "design-patterns"]
conformidade: "75"
author: "Willian Albarello"
date: "2026-10-12"
---
# Tell Don't Ask

## Conformidade: ⭐⭐⭐⭐ (75%)

## O que é

Não pergunte dados e tome decisões baseadas neles. Em vez disso, peça ao objeto que execute a ação que você precisa. "Não pergunte, diga o que fazer."

## No Projeto - Onde está bem

#### BattleEngineService.resolveBattleEnd

- Recebe `player` e `session` como parâmetros e executa lógica interna sem expor estado interno.
- O método toma decisões baseadas nos dados passados (víctory, defeat, draw), não queryando banco/global.

## No Projeto - Onde há "ask" (client side)

#### `world.scene.ts` - Pattern "ask" proliferante

- `if (gameState.currentBattle) return;` — query repetida.
- `getMyPlayer()` chamado repetidamente.
- `gameState.world.players` acessado para decidir o que fazer.
- Muitos `if (condition) ... else ...` baseados em state queries.

### Sugestão

Mover mais lógica de decisão para endpoints server (`step`, `startBattle`, `useItem`) em vez de queries client-side. O client deveria enviar comandos ("quero andar para cima", "querio atacar"), o server decidiria o resultado.

## Referências

- `battle-engine.service.ts:196-362` (logic internalized).
- `game.service.ts:374-431` (validation returns structured results).
- `world.scene.ts` inteiro (pattern "ask" client-side).
---
## 📌 Âncora de Navegação

[[tell-dont-ask]]

### Referências Cruzadas

- **Sugestão**: Mover mais lógica de decisão para endpoints server.
- **Conformidade**: 75% - boa aplicação no server, "ask" no client ainda presente.

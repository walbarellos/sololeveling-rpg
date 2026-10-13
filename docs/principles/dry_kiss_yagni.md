---
title: "Princípios DRY, KISS e YAGNI"
tags: ["dry", "kiss", "yagni", "best-practices"]
conformidade: "90"
author: "Willian Albarello"
date: "2026-10-12"
---
# Princípios DRY, KISS e YAGNI

## DRY - Don't Repeat Yourself ⭐⭐⭐⭐⭐

### Conformidade: ⭐⭐⭐⭐⭐ (90%)

- **`statMult(level)`** (`progression.ts:23-26`): usado em `skills.data.ts`, `enemies.data.ts`, `game.service.ts`, `battle.session.ts`.
- **`expToNext(level)`** e **`mobExp(level)`** mesma multiplicidade.
- **`CLASS_STATS`** registro centralizado — usado para inicializar classes no `battle.session.ts:49`.
- **`DEFAULT_OBSTACLES`**, `createInitialEnemies()` (`enemies.data.ts:102-218`).

### Exemplo

Fórmula de EXP calculada uma única vez e reutilizada em todo o código, evitando duplicação.

## KISS - Keep It Simple, Stupid ⭐⭐⭐⭐⭐

### Conformidade: ⭐⭐⭐⭐⭐ (90%)

- Regras de movimento: bounds check + obstacle check + enemy check — diretas.
- Regras de combate: adjacency check, damage roll, retaliation — fórmulas transparentes.
- Códigos de erro enumerados em vez de strings mágicas.
- Event names versionados em `ClientEvents`/`ServerEvents` object.

### Exemplo simples

Regras de combate explicitas e diretas, sem complexidade desnecessária.

## YAGNI - You Aren't Gonna Need It ⭐⭐⭐⭐⭐

### Conformidade: ⭐⭐⭐⭐⭐ (90%)

- **Nenhuma auth real**: handshake `playerKey` hashado server-side — ADR 12 nota explicitamente.
- **Demo constants** isolados em bloco condicional (`game.service.ts:83-87`).
- **Nenhuma otimização prematura**: cooldowns, bounds, adjacency são os mínimos necessários.
- **RNG strategy plugável** via `RngFn` — YAGNI de sistemas complexos até precisar.

### Exemplo

`DEMO_LEVEL`, `DEMO_RANK`, `DEMO_EXP`, `DEMO_STAT_POINTS` isolados e condicionados por `NODE_ENV`.

## Referências

- `progression.ts:23-26`
- `skills.data.ts:245-293`
- `game.service.ts:83-87`
- `battle.session.ts:47`
---
## 📌 Âncora de Navegação

[[principio-dry-kiss-yagni]]

### Referências Cruzadas

- **Conformidade geral**: ~90% - princípios bem aplicados, sem excessos.
- **Nota**: YAGNI é o que mais contribui para a simplicidade do projeto.

---
title: "Princípio do Polimorfismo"
tags: ["polymorphism", "interface", "design-patterns"]
conformidade: "90"
author: "Willian Albarello"
date: "2026-10-12"
---
# Princípio do Polimorfismo

## ✨ Resumo Rápido (3 linhas)

- **Conceito**: Objetos de diferentes classes responderem de forma diferente ao mesmo sinal.
- **Conformidade**: ⭐⭐⭐⭐ (85%).
- **Evidência**: `clock.ts:3` - `Clock` interface + `SystemClock` implementation.

## No Projeto

- **Através de interfaces + type discriminants**: `Clock` interface + `SystemClock` (`clock.ts:3-5`).
- **`PlayerRepository`** interface + `InMemoryPlayerRepository` (`player.repository.ts:70-75`).
- **Event schemas com Zod**: `ServerErrorCodeSchema` com 36 valores, `WorldStyleSchema`, `WorldIdSchema`.
- **HunterRank** usado como discriminant em `RANK_CAP` Record (`progression.ts:10-20`).

## Virtual Methods

- `SystemClock.nowMs()` "sobrige" a interface `Clock.nowMs()` (`clock.ts:7-10`).
- `PlayerRepository.findById()` / `save()` implementam interface (`player.repository.ts:77-128`).
- `BattleSession.executeAction()` define comportamento concreto (`battle.session.ts:175-307`).

## TypeScript Note

- Não existe keyword `virtual` em TypeScript; polimorfismo por implementação de interface.

## Referências

- `clock.ts:3-5`
- `player.repository.ts:70-75`
- `battle.session.ts:175-307`
---
## 📌 Âncora de Navegação

[[principio-polimorfismo]]

### Referências Cruzadas

- **SOLID: LSP** - `Clock` ↔ `SystemClock` substitutos completos.
- **Conformidade**: 85% - polimorfismo por interface implementation.

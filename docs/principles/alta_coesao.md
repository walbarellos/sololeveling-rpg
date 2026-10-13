---
title: "Alta Coesão"
tags: ["cohesion", "design-patterns"]
conformidade: "85"
author: "Willian Albarello"
date: "2026-10-12"
---
# Alta Coesão

## Conformidade: ⭐⭐⭐⭐ (85%)

### Cada classe foca em domínio específico

| Classe | Coesão (foco único) |
|--------|--------------------|
| `BattleEngineService` | Apenas concerns de battle engine (start battle, execute action, flee, resolve end) |
| `BattleSession` | Apenas estado de UM battle |
| `InMemoryPlayerRepository` | Apenas CRUD de players + cloning de estado |
| `Skills.data` | Funções puras de cálculo de stats — 100% coerente |
| `Progression` | Funções puras de progression — expToNext, statMult, mobExp |

### Avaliação

- **Fortes**: Cada classe foco em domínio específico, sem misturar responsabilidades unrelated.
- **Exemplo**: `BattleSession` não sabe nada sobre mundo exterior, apenas do seu battle interno.
- **Exemplo**: `Skills.data` apenas calcula stats, não lida com rede, persistence, ou renderização.

## Referências

- `battle-engine.service.ts:34-363`
- `battle.session.ts:17-426`
- `progression.ts:1-57`
- `skills.data.ts:245-293`
---
## 📌 Âncora de Navegação

[[alta-coesao]]

### Referências Cruzadas

- **Cada serviço tem responsabilidade única** (vistos em `game.service.ts` e `battle-engine.service.ts`).
- **Conformidade**: 85% - boa separação de responsabilidades.

---
title: "Composição sobre Herança"
tags: ["composition", "inheritance", "design-patterns"]
conformidade: "95"
author: "Willian Albarello"
date: "2026-10-12"
---
# Princípio da Composição sobre Herança

## ✨ Resumo Rápido (3 linhas)

- **Conceito**: Preferir compor objetos usando objetos de outras classes, ao invés de herdar delas.
- **Conformidade**: ⭐⭐⭐⭐⭐ (95%).
- **Evidência**: `battle-engine.service.ts:21-32` - `BattleEngineDependencies`.

## No Projeto

- **`BattleEngineDependencies`** (`battle-engine.service.ts:21-32`): interface composindo 10 serviços injetados.
- **`CLASS_STATS`** registry (`skills.data.ts:29-210`): dicionário de configs de classe, não herança `Warrior extends Character`.
- **HunterClass** usado como string/discriminant em vez de hierarchy de classes.
- **SystemClock implements Clock** (`clock.ts:3-5`): composition de interface, não inheritance de behavior.

## Por que Composição sobre Herança?

- **Flexibilidade**: pode trocar implementações via DI sem alterar código cliente.
- **Evitar deep inheritance hierarchies**: facilita manutenção e testabilidade.
- **Princípio ADR**: "Injeção de Clock abstraction" (ADR 8).

## Referências

- `battle-engine.service.ts:21-32`
- `skills.data.ts:29-210`
- `clock.ts:3-5`
- `ADR 8` — "Injectable Clock abstraction"
---
## 📌 Âncora de Navegação

[[principio-composicao-sobre-heranca]]

### Referências Cruzadas

- **SOLID: OCP** - Nova classe = adicionar ao `CLASS_STATS` sem modificar código existente.
- **Conformidade**: 95% - preferência explícita no projeto.

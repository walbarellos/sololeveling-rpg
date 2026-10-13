---
title: "Princípios SOLID Aplicados"
tags: ["solid", "srp", "dip", "design-patterns"]
conformidade: "85"
author: "Willian Albarello"
date: "2026-10-12"
---
# Princípios SOLID Aplicados

## S - Single Responsibility (SRP) ⭐⭐⭐⭐

### Conformidade: ⭐⭐⭐⭐ (85%)

Cada classe tem responsabilidade única e bem definida.

| Classe | Responsabilidade |
|--------|------------------|
| `GameService` | Orchestration - coordena movimentos, batalhas, progressão, inventory, missões, teleporte |
| `BattleEngineService` | Gerenciar estado de batalha ativa + execução de ações |
| `BattleSession` | Estado de uma única batalha (turnos, HP, MP, eventos, cooldowns) |
| `InMemoryPlayerRepository` | Apenas persistência/leitura de player entities |
| `LootService` | Gerar drops de itens e registrar stats de carreira |
| `InventoryService` | Equipar/desequipar/usar itens do inventário |
| `AcademyService` | Avaliar promoção de rank e claimar troféus |
| `BossService` | Gerenciar chefs de world boss + respawn lazy |
| `TeleportService` | Teletransição entre zones/shrines |

### Avaliação

- **Fortes**: Cada serviço foco em domínio específico (battle, inventory, academy, etc.).
- **Pontos de atenção**: `GameService` tem muitos "responsabilities" (200+ linhas), mas delegada pra outros services.

## O - Open/Closed (OCP) ⭐⭐⭐⭐

### Conformidade: ⭐⭐⭐⭐ (85%)

- **New hunter classes**: add to `CLASS_STATS` record sem modificar código existente ✓.
- **New ranks**: add to `RANK_CAP` progression sem modificar código existente ✓.

### Exemplo

Adicionar nova classe basta inserir entrada em `CLASS_STATS`, não é necessário reescrever `GameService`.

## L - Liskov Substitution (LSP) ⭐⭐⭐⭐

### Conformidade: ⭐⭐⭐⭐ (85%)

- `Clock` ↔ `SystemClock`: substitutos completos.
- `PlayerRepository` ↔ `InMemoryPlayerRepository`: swap teste/produção transparente.

### Exemplo

Em testes, pode-se injetar `new SystemClock()` ou um clock mock, e o `GameService` continua funcionando.

## I - Interface Segregation (ISP) ⭐⭐⭐⭐

### Conformidade: ⭐⭐⭐⭐ (85%)

Interfaces pequenas e focadas:

- **`Clock`**: 1 método (`nowMs()`).
- **`PlayerRepository`**: 4 métodos (`findById`, `save`, `delete`, `findAll`).
- **`BattleEngineDependencies`**: 10 métodos (pode ser split, mas pragmático atual).

## D - Dependency Inversion (DIP) ⭐⭐⭐⭐⭐

### Conformidade: ⭐⭐⭐⭐⭐ (95%)

1. `GameService` depende de `Clock` e `PlayerRepository` abstratos.
2. Injetados via construtor: `@Optional() @Inject(CLOCK)` e `@Optional() @Inject(PLAYER_REPOSITORY)`.
3. `CLOCK` symbol: abstração que isola lógica de domínio do relógio de sistema.
4. Em testes: pode injetar `new SystemClock()` ou clock mock sem mexer em `GameService`.
5. `BattleEngineService` depende de `BattleEngineDependencies` interface (não de classes concretas).

### Referências

- `game.service.ts:128-132`
- `clock.ts:3-5`
- `player.repository.ts:70-75`
- `ADR 8` — "Injectable Clock abstraction"
---
## 📌 Âncora de Navegação

[[principio-solid]]

### Referências Cruzadas

- **Cada princípio SOLID tem seu sub-item acima** com nota detalhada.
- **Conformidade geral**: 85% média ponderada.

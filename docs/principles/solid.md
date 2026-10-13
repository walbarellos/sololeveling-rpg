# Princípios SOLID Aplicados

## S - Single Responsibility Principle
Cada classe tem responsabilidade única e bem definida:

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

## O - Open/Closed Principle
Novo conteúdo pode ser adicionado sem modificar código existente:

- **New hunter classes**: add to `CLASS_STATS` record (`skills.data.ts:29-210`) sem modificar código existente
- **New ranks**: add to `RANK_CAP` progression (`progression.ts:10-20`)
- **New missions**: adicionar ao array `MISSIONS`

## L - Liskov Substitution
Interfaces satisfazem substituição por subtipos:

- `Clock` ↔ `SystemClock`: substitutos completos
- `PlayerRepository` ↔ `InMemoryPlayerRepository`: swap teste/produção transparente
- Injeção de dependência permite substituição horizontal

## I - Interface Segregation
Interfaces pequenas e focadas:

- **`Clock`**: 1 método (`nowMs()`)
- **`PlayerRepository`**: 4 métodos (`findById`, `save`, `delete`, `findAll`)
- **`BattleEngineDependencies`**: 10 métodos (pode ser split, mas pragmático atual)

## D - Dependency Inversion
Alto nível depende de abstrações:

- `GameService` depende de `Clock`/`PlayerRepository` abstratos
- Injetados via construtor: `@Inject(CLOCK)` + `@Inject(PLAYER_REPOSITORY)`
- `CLOCK` symbol abstraction (`clock.ts`) permite substituir clock sem mexer em `GameService`

## Referências
- `game.service.ts:128-132`
- `clock.ts`
- `player.repository.ts:70-75`
- `battle-engine.service.ts:21-32`

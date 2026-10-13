# Princípio da Composição sobre Herança

## Conceito
Preferir compor objetos usando objetos de outras classes, ao invés de herdar delas. Mais flexível e evita o acoplamento rígido da herança.

## No Projeto
- **`BattleEngineDependencies`** (`battle-engine.service.ts:21-32`): interface composindo 10 serviços injetados
  ```typescript
  interface BattleEngineDependencies {
    playerRepository: PlayerRepository;
    bossService: BossService;
    lootService: LootService;
    inventoryService: InventoryService;
    enemies: Map<string, EnemySnapshot>;
    killEnemy: (enemy) => void;
    reviveEnemies: () => void;
    spawnOf: (player) => {x, y};
    grantExp: (player, session) => void;
    nextSequence: () => number;
  }
  ```
- **`GameService`** injeta `lootService`, `academyService`, `bossService`, `missionsService`, `inventoryService`
- **`TeleportService`** recebe todas dependências via construtor
- **`CLASS_STATS`** registry em vez de hierarquia `extends`

## Padrões Usados
- **Dependency Injection**: serviços injetados via construtor
- **Strategy Pattern**: `RngFn` em `battle.session.ts:15`, trocável via `setRng(fn)`

## Filosofia
- "Favor composição sobre herança" é um dos ADRs explícitos do projeto
- Classes abstratas não usadas - abstração via interfaces + classes concretas
- `SystemClock implements Clock` - composition de interface, não inheritance de behavior

## Referências
- `battle-engine.service.ts:21-32`
- `game.service.ts:128-154`
- `clock.ts:3-5`
- `skills.data.ts:29-210` (CLASS_STATS registry)

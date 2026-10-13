# Composição sobre Herança

## Conformidade: ⭐⭐⭐⭐⭐ (90%)

### Explicitamente preferida no projeto

#### BattleEngineDependencies
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
- **Onde**: `battle-engine.service.ts:21-32`
- **Por que composição**: injeta 10 serviços via construtor, não herança profunda de classe

#### CLASS_STATS registry
```typescript
export const CLASS_STATS: Record<HunterClass, ClassConfig> = { ... };
```
- **Onde**: `skills.data.ts:29-210`
- **Por que composição**: dicionário de configs de classe, não herança `Warrior extends Character`

#### HunterClass como discriminant
- Usado como string/discriminant em vez de hierarchy de classes
- `CLASS_STATS[hunterClass]` acessa config por nome

#### SystemClock implements Clock
- **Onde**: `clock.ts:3-5`
- **Por que composição**: `SystemClock` implements a interface `Clock`, não herda behavior de uma classe base

### Por que composição sobre herança?
- **Flexibilidade**: pode trocar implementações via DI sem alterar código cliente
- **Evitar deep inheritance hierarchies**: facilita manutenção e testabilidade
- **Princípio ADR**: "Injeção de Clock abstraction" (ADR 8)

### Quando herança é usada?
- Apenas `WorldScene extends Phaser.Scene` — driven por framework, não domínio
- `SystemClock implements Clock` — implementação de interface
- Nenhuma hierarquia `extends` profunda no domínio de jogo

## Referências
- `battle-engine.service.ts:21-32`
- `skills.data.ts:29-210`
- `clock.ts:3-5`
- `ADR 8` — "Injectable Clock abstraction"

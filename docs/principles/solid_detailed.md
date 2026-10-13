# Princípios SOLID Detalhados

## S - Single Responsibility (SRP) ⭐⭐⭐⭐

### Conformidade: ⭐⭐⭐⭐ (85%)
Cada serviço tem responsabilidade única e bem definida:

| Serviço | Responsabilidade Única |
|---------|----------------------|
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
- **Fortes**: Cada serviço foca em um domínio específico (battle, inventory, academy, etc.)
- **Pontos de atenção**: `GameService` tem muitos "responsabilities" (200+ linhas), mas delegada pra outros services — SRP satisfat no nível de método

### Referências
- `game.service.ts:111-998` (muitos serviços injetados/usados)
- `battle-engine.service.ts:34-363`
- `battle.session.ts:17-426`

## O - Open/Closed (OCP) ⭐⭐⭐⭐

### Conformidade: ⭐⭐⭐⭐ (85%)
- **New hunter classes**: add to `CLASS_STATS` record sem modificar código existente ✓
- **New ranks**: add to `RANK_CAP` progression sem modificar código existente ✓
- **Como funciona**: novo content é adicionado extensões (registros), não modificação de lógica existente

### Exemplo
Adicionar nova classe `BRAWLER` basta inserir entrada em `CLASS_STATS`, não é necessário reescrever `GameService` ou `BattleSession`.

### Referências
- `skills.data.ts:29-210` (CLASS_STATS registry)
- `progression.ts:10-20` (RANK_CAP)

## L - Liskov Substitution (LSP) ⭐⭐⭐⭐

### Conformidade: ⭐⭐⭐⭐ (85%)
- `Clock` ↔ `SystemClock`: substitutos completos — qualquer código que espere `Clock` funciona com `SystemClock`
- `PlayerRepository` ↔ `InMemoryPlayerRepository`: swap teste/produção transparente
- Injeção de dependência permite substituição horizontal sem quebrar client code

### Exemplo
Em testes, pode-se injetar `new SystemClock()` ou um clock mock, e o `GameService` continua funcionando exatamente igual.

### Referências
- `clock.ts:3-5`
- `player.repository.ts:70-75`

## I - Interface Segregation (ISP) ⭐⭐⭐⭐

### Conformidade: ⭐⭐⭐⭐ (85%)
Interfaces pequenas e focadas em vez de uma interface gigante:

- **`Clock`**: 1 método (`nowMs()`) — focused interface
- **`PlayerRepository`**: 4 métodos (`findById`, `save`, `delete`, `findAll`) — focused interface
- **`BattleEngineDependencies`**: 10 métodos (pode ser split em interfaces menores, mas pragmático atual justifica manutenção assim)

### Por que interfaces pequenas?
- Facilita implementar apenas o que precisa
- Reduz o acoplamento desnecessário
- Permite combinações flexíveis

### Referências
- `clock.ts:3-5` (1 método)
- `player.repository.ts:70-75` (4 métodos)
- `battle-engine.service.ts:21-32` (10 métodos - discussão sobre split)

## D - Dependency Inversion (DIP) ⭐⭐⭐⭐⭐

### Conformidade: ⭐⭐⭐⭐⭐ (95%)
Alto nível depende de abstrações, não de implementações:

1. **`GameService`** depende de `Clock` e `PlayerRepository` abstratos
2. Injetados via construtor: `@Optional() @Inject(CLOCK)` e `@Optional() @Inject(PLAYER_REPOSITORY)`
3. `CLOCK` symbol: abstração que isola lógica de domínio do relógio de sistema
4. Em testes: pode injetar `new SystemClock()` ou clock mock sem mexer em `GameService`
5. `BattleEngineService` depende de `BattleEngineDependencies` interface (não de classes concretas)

### Por que DIP é forte aqui?
- Inversão de controle fundamental da arquitetura
- Permite testar lógica de domínio isoladamente
- Facilita troca de implementações (InMemory ↔ PostgreSQL)
- Consistente com ADR 8: "Injectable Clock abstraction"

### Referências
- `game.service.ts:128-132`
- `clock.ts:3-5`
- `player.repository.ts:70-75`
- `ADR 8` — "Injectable Clock abstraction"

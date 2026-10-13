# Baixo Acoplamento

## Conformidade: ⭐⭐⭐⭐⭐ (90%)

### Contratos isolados
- **`packages/contracts/`**: pacote totalmente isolado — zero dependência de NestJS/Phaser/Databases
- Apenas Zod schemas e types TypeScript
- Zero import de frameworks de framework no pacote de contracts

### Interfaces para implementações
- **`GameService`** depende de `Clock`/`PlayerRepository` abstratos (não de concretudes)
- **`BattleEngineService`** depende de `BattleEngineDependencies` interface (não de classes concretas)
- **Injeção de dependência** garante que high-level modules dependam de abstrações

### Medido por
- `contracts/` package independence: o pacote contracts não importa NestJS, Phaser, ou databases
- Interfaces para implementações em todo código domínio
- `GameService`: `@Optional() @Inject(CLOCK)` e `@Optional() @Inject(PLAYER_REPOSITORY)`
- `BattleEngineService`: injeção de `BattleEngineDependencies` interface

### Referências
- `packages/contracts/src/index.ts` — "pure domain logic free of NestJS, Phaser, database imports" (ADR 8)
- `game.service.ts:128-132`
- `battle-engine.service.ts:21-32`

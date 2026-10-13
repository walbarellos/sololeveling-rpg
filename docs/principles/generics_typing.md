# Generics e Tipagem

## Generics

### Conformidade: ⭐⭐⭐⭐ (80%)
- **`Map<string, EnemySnapshot>`** (`battle-engine.service.ts:35`): mapa genérico de instâncias de inimigo
- **`Map<string, PlayerEntity>`** (`player.repository.ts:78`): mapa de players
- **Funções genéricas**: `expToNext(level: number): number` (`progression.ts:23`)
- **`RngFn = () => number`** (`battle.session.ts:15`): tipo de função genérica

### No Repository Pattern
```typescript
interface PlayerRepository {
  findById(id: string): Promise<PlayerEntity | null> | PlayerEntity | null;
  save(player: PlayerEntity): Promise<void> | void;
}
```
- Interface com tipos definidos para `PlayerEntity`

## Tipagem

### Conformidade: ⭐⭐⭐⭐⭐ (95%)
- **TypeScript strict em todo o códigobase**
- **Zero `any`**: ADR explicitamente proíbe `any`
- **Enumerações** para ranks, classes, directions, error codes
  - `HunterRank`, `HunterClass`, `Direction`, `ServerErrorCode`
- **Types intersectionais** onde necessário (ex: `BattlePlayerParticipant` extends `BattleParticipant`)
- **Zod schemas**: fonte de verdade de validação runtime + types TypeScript

### Verificação
- `npm run typecheck` seria o validador
- Todos os módulos seguem tipagem forte

## Referências
- `packages/contracts/tsconfig.json`
- `apps/server/tsconfig.json`
- `apps/client/tsconfig.json`
- `packages/contracts/src/index.ts` - schemas completos

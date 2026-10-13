# Modularidade e Reutilização

## Modularidade

### Conformidade: ⭐⭐⭐⭐⭐ (90%)
- **`packages/contracts/`**: pacote totalmente isolado — zero dependência de NestJS/Phaser/Databases
  - Apenas schemas Zod + types puros
  - Pode ser usado independentemente do restante
- **`apps/server/`**: lógica de domínio NestJS
- **`apps/client/`**: apresentação Phaser + React
- **Boundary clara**: cliente envia `StepRequest`/`StartBattleRequest`, recebe `PlayerSnapshot`/`BattleSnapshot`

### Workspaces Monorepo
```json
"workspaces": ["apps/*", "packages/*"]
```
- Separação de preocupações entre contracts/server/client
- `npm run typecheck` → contracts + workspaces
- `npm run build` → contracts + workspaces
- `npm test` → build + test workspaces

## Reutilização

### Conformidade: ⭐⭐⭐⭐⭐ (90%)
- **Funções puras compartilhadas em todo o códigobase**:
  - `statMult(level)` (`progression.ts:23-26`): usado em `skills.data.ts`, `enemies.data.ts`, `game.service.ts`, `battle.session.ts`
  - `expToNext(level)` (`progression.ts:23`): mesma multiplicidade
  - `mobExp(level)` (`progression.ts:26`): mesma
  - `calculatePlayerStats()` (`skills.data.ts:245-267`): usado em `battle.session.ts:75-81`, `game.service.ts:506-518`
  - `calculatePlayerMaxHp()` / `calculatePlayerMaxMp()` (`skills.data.ts:279-293`)
  - `CLASS_STATS` registro centralizado (`skills.data.ts:29-210`)

### Exemplo prático
Fórmula `statMult(level) = 1 + 0.09 * (level - 1)` usada tanto no cálculo de dano do jogador quanto no cálculo de HP de monstros, garantindo consistência.

## Referências
- `packages/contracts/tsconfig.json`
- `packages/contracts/package.json`
- `progression.ts:23-26`
- `skills.data.ts:245-293`
- `enemies.data.ts:76-100`

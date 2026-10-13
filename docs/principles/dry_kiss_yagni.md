# Princípios DRY, KISS e YAGNI

## DRY - Don't Repeat Yourself

### Conformidade: ⭐⭐⭐⭐⭐ (90%)
- **`statMult(level)`** (`progression.ts:23-26`): usado em `skills.data.ts`, `enemies.data.ts`, `game.service.ts`, `battle.session.ts`
- **`expToNext(level)`** (`progression.ts:23`): mesma multiplicidade
- **`mobExp(level)`** (`progression.ts:26`): mesma
- **`CLASS_STATS`** (`skills.data.ts:29-210`): registro centralizado, usado para inicializar classes no `battle.session.ts:49`
- **`DEFAULT_OBSTACLES`**, `createInitialEnemies()` (`enemies.data.ts:102-218`): single source de truth

### Exemplo
Fórmula de EXP calculada uma única vez e reutilizada em todo o códigobase, evitando duplicação.

## KISS - Keep It Simple, Stupid

### Conformidade: ⭐⭐⭐⭐⭐ (90%)
- Regras de movimento: bounds check + obstacle check + enemy check — diretas
- Regras de combate: adjacency check, damage roll, retaliation — fórmulas transparentes
- Códigos de erro enumerados em vez de strings mágicas
- Event names versionados em `ClientEvents`/`ServerEvents` object

### Exemplo simples
Regras de combate explicitas e diretas, sem complexidade desnecessária.

## YAGNI - You Aren't Gonna Need It

### Conformidade: ⭐⭐⭐⭐⭐ (90%)
- **Nenhuma auth real**: handshake `playerKey` hashado server-side — ADR 12 nota explicitamente
- **Demo constants** isolados em bloco condicional (`game.service.ts:83-87`)
- **Nenhuma otimização prematura**: cooldowns, bounds, adjacency são os mínimos necessários
- **RNG strategy plugável** via `RngFn` — YAGNI de sistemas complexos até precisar

### Exemplo
`DEMO_LEVEL`, `DEMO_RANK`, `DEMO_EXP`, `DEMO_STAT_POINTS` isolados e condicionados por `NODE_ENV`.

## Referências
- `progression.ts:23-26`
- `skills.data.ts:245-293`
- `game.service.ts:83-87`
- `battle.session.ts:47`

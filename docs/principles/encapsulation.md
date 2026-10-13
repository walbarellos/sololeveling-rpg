# Princípio do Encapsulamento

## Conceito
Ocultar o estado interno dos objetos e expor apenas o necessário através de interfaces controladas. Usar `private` para proteger dados críticos.

## No Projeto
- **`GameService`** (`game.service.ts:113-126`): `private obstacleSet`, `private enemies`, `private online`, `private diedAt`, `private sequence`, `private worlds`
- **`InMemoryPlayerRepository`** (`player.repository.ts:78`): `private readonly store = new Map`
- **`BattleSession`** (`battle.session.ts:36-47`): `private skillDefs`, `private enemyDamageBase`, `private rng`
- **`BattleEngineService`** (`battle-engine.service.ts:36`): `private battleCounter = 0`
- **`WorldScene`** (`world.scene.ts:58-68`): `playerGraphics`, `enemyGraphics`, `terrainImage`, `terrainKey`, `overlay`, `hint`, `zoneBanner`, etc.

## Acesso Público Intencional
- `GameService`: `public readonly bossService`, `battleEngineService`, `teleportService`
- `BattleEngineService`: `public readonly activeBattles = new Map`
- `WorldObjectsManager`: `public portalObjects`, `npcObjects`, `currentPortals`, `shrineObjects`

## Ausência de `protected`
- **Nenhum `protected` encontrado** em todo o códigobase - preferência por composição sobre herança

## Referências
- `apps/server/src/domain/game.service.ts:113-126`
- `player.repository.ts:78`
- `battle.session.ts:36-47`
- `world.scene.ts:58-68`

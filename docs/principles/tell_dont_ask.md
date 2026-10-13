# Tell Don't Ask

## Conformidade: ⭐⭐⭐⭐ (75%)

## O que é
Não pergunte dados e tome decisões baseadas neles. Em vez disso, peça ao objeto que execute a ação que você precisa. "Não pergunte, diga o que fazer."

## No Projeto - Onde está bem

#### BattleEngineService.resolveBattleEnd
- Recebe `player` e `session` como parâmetros e executa lógica interna sem expor estado interno
- O método toma decisões baseadas nos dados passados (víctory, defeat, draw), não queryando banco/global

#### GameService.step()
- Validações retornam structured results `{success, error}` ao invés de booleanos + side effects
- O servidor toma decisões sobre movimento, combate, cooldown baseando-se nos parâmetros recebidos

## No Projeto - Onde há "ask" (client side)

#### `world.scene.ts` - Pattern "ask" proliferante
- `if (gameState.currentBattle) return;` — query repetida
- `getMyPlayer()` chamado repetidamente
- `gameState.world.players` acessado para decidir o que fazer
- Muitos `if (condition) ... else ...` baseados em state queries

### Sugestão
Mover mais lógica de decisão para endpoints server (`step`, `startBattle`, `useItem`) em vez de queries client-side. O client deveria enviar comandos ("quero andar para cima", "querio atacar"), o server decidiria o resultado.

## Referências
- `battle-engine.service.ts:196-362` (logic internalized)
- `game.service.ts:374-431` (validation returns structured results)
- `world.scene.ts` inteiro (pattern "ask" client-side)

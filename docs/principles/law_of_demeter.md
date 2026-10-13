# Lei de Demeter (Law of Demeter)

## Conformidade: ⭐⭐⭐⭐ (70%)

### O que é
Princípio de "talk only to your immediate friends" - não conversar com estranhos. Um objeto não deve conhecer os internos de outros objetos que sejam "um nível abaixo" do seu amigo direto.

### No Projeto - Onde está bem

#### GameService
- **Métodos como `toSnapshot(p)`** encapsulam acesso a propriedades do player
- **Validações estruturadas** retornam `{success, error}` ao invés de booleanos puros

### No Projeto - Onde há violações (client side)

#### `world.scene.ts` - Muitas violações diretas
- `gameState.world.players` acessado diretamente em loops
- `p.worldId`, `p.position.x`, `p.position.y` acessados diretamente
- `c.getData("lastClass") !== p.hunterClass` — acesso direto a data do Phaser container
- `c.getData("lastHpW") !== hpW` — acesso direto a hash de HP

### Sugestão de Refatoramento
Criar methods seletores no `game-state.ts`:
- `getMyPlayer()` → retorna player snapshot
- `isInBattle()` → verifica `currentBattle`
- `getObstacles()` → retorna lista de obstáculos
- `getEnemiesAlive()` → lista de inimigos vivos

### Referências
- `world.scene.ts:419-420, 372-376`
- `game-state.ts`

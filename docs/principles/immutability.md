# Imutabilidade

## Conformidade: ⭐⭐⭐⭐ (80%)

### Onde está aplicada
- **No contracts**: Zod schemas são imutáveis por definição; types são `type` não `interface` mutable
- **Pure functions** em `progression.ts`, `skills.data.ts`: funções sem side effects, retornam novos objetos
- **InMemoryPlayerRepository** (`player.repository.ts:97-108`): clone profundo via spread (`...found.position`, `...found.attributes`) ao ler — garante que dados lidos não são mutados diretamente
- **BattleSession.events** (`battle.session.ts`): `this.log.push(text)` e `this.events.push(...)` mutam, mas `toSnapshot()` retorna cópias

### Onde NÃO está (trade-off de performance)
- **GameService**: atualiza player in-place (`player.position = {...}`, `player.hp = ...`) — pattern de performance para game loop, mas poderia ser imutável com structural sharing
- **Motivação**: performance para game loop de 60fps — imutabilidade adicionaria overhead desnecessário

### Balanceamento
- Funções puras em `progression.ts`, `skills.data.ts` são totalmente imutáveis e testáveis
- Estado do jogo usa mutação controlada para performance, mas com encapsulamento (`private` fields, métodos públicos controlados)

### Referências
- `progression.ts` - pure functions
- `player.repository.ts:97-108` (clone/spread)
- `contracts/index.ts` - schemas imutáveis

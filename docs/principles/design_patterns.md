# Padrões de Projeto Aplicados

## Repository Pattern (ADR 6)
### `PlayerRepository` interface + `InMemoryPlayerRepository`
- **Onde**: `player.repository.ts:70-75`
- **Função**: Abstrair acesso a dados do jogador, permitindo swap InMemory ↔ PostgreSQL sem alterar lógica de domínio
- **Benefício**: Testabilidade e troca de persistência sem refatorar domínio

## Strategy Pattern
### `RngFn` type em `BattleSession`
### `onde`: `battle.session.ts:15-16`
```typescript
export type RngFn = () => number;
```
- **Onde**: `battle.session.ts:15-16`
- **Função**: Função de número aleatório estratégica, trocável via `setRng(fn)`
- **Produção**: `Math.random()`, **Tests**: `() => 0.99`

## Dependency Injection (ADR 8)
### `@Injectable()` + `@Inject` em todo servidor
### `onde`: `game.service.ts:128-132`, `battle-engine.service.ts:38`
- **Injeção de dependência** NestJS em todos os serviços
- **`CLOCK` symbol**: abstração que permite clock mock em testes
- **`PLAYER_REPOSITORY` token**: injeção opcional com fallback `InMemoryPlayerRepository`

## Service Pattern
### `LootService`, `InventoryService`, `AcademyService`, `BossService`
### `onde`: respectivos arquivos `apps/server/src/domain/`
- **Função**: Cada serviço encapsula uma área de lógica específica
- **Benefício**: Separação de responsabilidades clara, fácil manutenção e teste

## Observer Pattern
### `GameGateway` `OnGatewayConnection`/`OnGatewayDisconnect`
### `onde`: `apps/server/src/realtime/`
- **Função**: Broadcast snapshots para todos os connected clients
- **Eventos**: `SessionReplaced` quando sessão muda

## Adapter Pattern
### `SystemClock` adapta `Date.now()` → `Clock` interface
### `onde`: `clock.ts:3-5`
- **Função**: Adaptar `Date.now()` à interface `Clock`
- **Benefício**: Isolar lógica de domínio do relógio de sistema, facilitar testes

## Facade Pattern
### `GameService` como facade para subsistemas maiores
### `onde`: `game.service.ts:111-998`
- **Função**: Coordenar movimentos, batalhas, progressão, inventory, missões, teleporte em um único ponto

## Referências
- `task_result` anterior (comprehensive listing)

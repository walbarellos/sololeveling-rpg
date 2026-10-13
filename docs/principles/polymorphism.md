# Princípio do Polimorfismo

## Conceito
Capacidade de objetos de diferentes classes responderem de formas diferentes ao mesmo sinal de mensagem. Na prática, permite que uma interface tenha múltiplas implementações.

## No Projeto
- **Através de interfaces + type discriminants**: `Clock` interface + `SystemClock` implementation (`clock.ts:3-5`)
- **`PlayerRepository`** interface + `InMemoryPlayerRepository` (`player.repository.ts:70-75`)
- **Event schemas com Zod**: `ServerErrorCodeSchema` com 36 valores, `WorldStyleSchema`, `WorldIdSchema`, `HunterRank`
- **HunterRank** usado como discriminant em `RANK_CAP` Record (`progression.ts:10-20`)

## Virtual Methods
- `SystemClock.nowMs()` "sobrige" a interface `Clock.nowMs()` (`clock.ts:7-10`)
- `PlayerRepository.findById()` / `save()` implementam interface (`player.repository.ts:77-128`)
- `BattleSession.executeAction()` define comportamento concreto

## TypeScript Note
- Não existe keyword `virtual` em TypeScript; polimorfismo por implementação de interface

## Referências
- `clock.ts:3-5`
- `player.repository.ts:70-75`
- `battle.session.ts:175-307`

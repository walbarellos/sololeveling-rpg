# Princípio da Abstração

## Conceito
Focar o que é essencial e esconder detalhes desnecessários. No código, abstração significa esconder a implementação complexa atrás de interfaces simples.

## No Projeto
- **Interface `Clock`** (`clock.ts`): abstração do tempo, permitindo substituir `SystemClock` por mocks em testes
- **Interface `PlayerRepository`** (`player.repository.ts`): abstração para persistência de jogadores, permitindo `InMemoryPlayerRepository` ↔ PostgreSQL
- **Zod schemas** (`packages/contracts/src/index.ts`): schemas como fonte de verdade de validação, tipos TypeScript inferidos automaticamente

## Benefícios
- Allows swapping implementations without changing high-level code
- Enables testability through dependency inversion
- Reduces complexity by hiding unnecessary details

## Referências
- `apps/server/src/domain/clock.ts` - Interface + implementação
- `apps/server/src/domain/player.repository.ts` - Interface + InMemory implementation
- `packages/contracts/src/index.ts` - Todos os schemas Zod

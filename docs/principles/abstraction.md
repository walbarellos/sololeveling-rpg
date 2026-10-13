---
title: "Princípio da Abstração"
tags: ["abstraction", "interface", "design-patterns"]
conformidade: "95"
author: "Willian Albarello"
date: "2026-10-12"
---
# Princípio da Abstração

## ✨ Resumo Rápido (3 linhas)

- **Conceito**: Foco em o que é essencial e esconder detalhes desnecessários.
- **Conformidade**: ⭐⭐⭐⭐⭐ (95%).
- **Evidência**: `clock.ts:3` - Interface `Clock` com `SystemClock`.

## ## Abstração no Projeto

- **Interface `Clock`** (`clock.ts:3-5`): abstração do tempo, permitindo substituir `SystemClock` por mocks em testes.
- **Interface `PlayerRepository`** (`player.repository.ts:70-75`): abstração para persistência de jogadores, permitindo `InMemoryPlayerRepository` ↔ PostgreSQL.
- **Zod schemas** (`packages/contracts/src/index.ts`): schemas como fonte de verdade de validação, tipos TypeScript inferidos automaticamente.

## Benefícios

- Permite trocar implementações sem alterar código de alto nível.
- Habilita testabilidade através de inversão de dependência.
- Reduz complexidade ao esconder detalhes desnecessários.

## Referências

- `apps/server/src/domain/clock.ts` - Interface + implementação.
- `apps/server/src/domain/player.repository.ts` - Interface + `InMemoryPlayerRepository`.
- `packages/contracts/src/index.ts` - Todos os schemas Zod.
---
## 📌 Âncora de Navegação

[[principio-abstracao]]

### Referências Cruzadas

- **SOLID: DIP** - Depende de abstrações, não de implementações.
- **Conformidade**: 95% - alta padronização de interfaces.

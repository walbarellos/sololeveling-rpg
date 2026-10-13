---
title: "Sobrecarga, Classes Abstratas e Métodos Virtuais"
tags: ["overload", "abstract", "virtual", "design-patterns"]
conformidade: "70"
author: "Willian Albarello"
date: "2026-10-12"
---
# Sobrecarga, Classes Abstratas e Métodos Virtuais

## Sobrecarga ⭐

### Conformidade: ⭐ (15%)

- **Não encontrada** no código base.
- TypeScript suporta function overloads, mas **não utilizada** neste projeto.
- Todos os métodos têm assinatura única consistente.

### Onde poderia ajudar

- `claimLostTrophy(playerId, trophyId?)` - optional parameter no lugar de overload.
- `allocateStats` com múltiplas variantes de entrada.

### Padrão alternativo

Usar parâmetros opcionais em vez de overloads TypeScript puros:

```markdown
// Em vez de overloads:
claimLostTrophy(playerId: string, trophyId?: string): Promise<...>

// Padrão usado:
claimLostTrophy(playerId: string, trophyId?: string): Promise<...>
```

## Classes Abstratas ⭐

### Conformidade: ⭐ (10%)

- **Nenhuma `abstract class`** encontrada em todo o código base.
- Abstração alcançada através de **interfaces** + classes concretas.
- `Clock` interface + `SystemClock` implementação (não abstract class).
- `PlayerRepository` interface + `InMemoryPlayerRepository` implementação.

### Por quê?

- Interfaces são mais flexíveis em TypeScript/NestJS para DI.
- Abstract classes teriam limitado flexibilidade para múltiplas implementações.
- Princípio já satisfeito através de interfaces + classes concretas.

### Referências

- Nenhuma `abstract class` encontrada em toda a base.
- `clock.ts`, `player.repository.ts` usam `interface` keyword.

## Métodos Virtuais ⭐⭐⭐⭐

### Conformidade: ⭐⭐⭐⭐ (80%)

- **Através de polimorfismo de interface + convenção**.
- `Clock.nowMs()` - virtual por definição de interface (quaisquer classes implementando).
- `PlayerRepository.findById()` / `save()` - virtual por interface contract.
- `BattleSession.executeAction()` - método "virtual" definindo comportamento que pode ser estendido.
- `BattleEngineService.executeBattleAction()` - define esqueleto que pode ser sobrescrito.

### TypeScript Note

- `virtual` keyword não existe em TypeScript; polimorfismo é por interface implementation.

### Referências

- `clock.ts:3-5`
- `player.repository.ts:70-75`
- `battle.session.ts:175-307`
- `battle-engine.service.ts:113-142`
---
## 📌 Âncora de Navegação

[[sobrecarga-abstrata-virtual]]

### Referências Cruzadas

- **Sobrecarga**: Não utilizada; optional parameters no lugar.
- **Classes Abstratas**: Não usadas; interfaces satisfazem a necessidade.
- **Métodos Virtuais**: Por polimorfismo de interface (não keyword `virtual` em TS).

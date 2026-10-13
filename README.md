# RPG Web Foundation

## 📋 Documentação Estruturada

Este repositório contém a fundação para um RPG browser-based 2D de mundo compartilhado do tipo "Hunter RPG", com mecânicas de grid/tile-based inspiradas em Naruto Game e Solo Leveling.

### 📦 Visão Geral

- **Cliente**: Vite + Phaser 3 + TypeScript
- **Servidor**: NestJS + Socket.IO
- **Contratos Compartilhados**: Zod schemas em `@rpg/contracts`
- **Arquitetura**: Server-authoritative com discrete step protocol e anti-speedhack

### 📁 Estrutura da Documentação

A documentação está organizada em arquivos markdown separados na pasta `docs/`, cada um focado em um princípio ou padrão de projeto específico.

#### Princípios OOP e Design Patterns

| Arquivo | Principio/Padrão | Conformidade |
|---------|-----------------|--------------|
| `docs/principles/abstraction.md` | Abstração | ⭐⭐⭐⭐⭐ |
| `docs/principles/encapsulation.md` | Encapsulamento | ⭐⭐⭐⭐⭐ |
| `docs/principles/inheritance.md` | Herança | ⭐⭐⭐⭐ |
| `docs/principles/polymorphism.md` | Polimorfismo | ⭐⭐⭐⭐ |
| `docs/principles/composition.md` | Composição sobre Herança | ⭐⭐⭐⭐⭐ |
| `docs/principles/solid.md` | SOLID | ⭐⭐⭐⭐⭐ |
| `docs/principles/dry_kiss_yagni.md` | DRY, KISS, YAGNI | ⭐⭐⭐⭐⭐ |
| `docs/principles/design_patterns.md` | Design Patterns | ⭐⭐⭐⭐⭐ |
| `docs/principles/generics_typing.md` | Generics e Tipagem | ⭐⭐⭐⭐ |
| `docs/principles/immutability.md` | Imutabilidade | ⭐⭐⭐⭐ |
| `docs/principles/law_of_demeter.md` | Lei de Demeter | ⭐⭐⭐⭐ |
| `docs/principles/tell_dont_ask.md` | Tell Don't Ask | ⭐⭐⭐⭐ |
| `docs/principles/overloads_abstract_virtual.md` | Sobrecarga/Classes Abstratas/Métodos Virtuais | ⭐⭐⭐⭐ |
| `docs/principles/alta_coesao.md` | Alta Coesão | ⭐⭐⭐⭐ |
| `docs/principles/baixo_acoplamento.md` | Baixo Acoplamento | ⭐⭐⭐⭐⭐ |

#### Outras Documentações

- `docs/index.md` - Índice geral conectando todos os princípios
- `docs/FAQ.md` - Perguntas frequentes sobre mecânicas do RPG

### 🏗️ Arquitetura do Sistema

O sistema segue uma arquitetura em camadas com separação clara de responsabilidades:

- **Apresentação (React + Phaser)**: Responsável pela interface visual e interação do usuário
- **Servidor (NestJS)**: Lógica de negócios, validação de regras de jogo, autoridade do servidor
- **Camada de Contratos (@rpg/contracts)**: Schemas Zod como fonte de verdade, types TypeScript compartilhados
- **Princípios Aplicados**: Abstração, Encapsulamento, Herança, Polimorfismo, Composição, SOLID, DRY, KISS, YAGNI

### 🔬 Análise de Princípios Aplicados

A documentação detalhada em `docs/principles/` inclui análise de:

- **Abstração** - Interface `Clock`/`PlayerRepository`, Zod schemas como fonte de verdade
- **Encapsulamento** - `private` em toda lógica crítica, `public` apenas API intencional
- **Herança** - Uso limitado; preferência por composição (`BattleEngineDependencies`)
- **Polimorfismo** - Através de interfaces + type discriminants (`Clock`, `PlayerRepository`)
- **Composição sobre Herança** - `BattleEngineDependencies`, `CLASS_STATS` registry, `SystemClock implements Clock`
- **SOLID** - SRP (cada serviço foco único), OCP (nova classe = adicionar ao `CLASS_STATS`), LSP (`Clock` ↔ `SystemClock`), ISP (interfaces pequenas), DIP (injeção de dependência abstrata)
- **DRY** - `statMult`, `expToNext`, `mobExp` usadas em todo o código
- **KISS** - Regras diretas, códigos de erro enumerados, events versionados
- **YAGNI** - Nenhuma feature antecipada; constants demo isolados; RNG plugável
- **Design Patterns** - Repository, Strategy, DI, Service, Observer, Adapter, Facade
- **Modularidade** - `packages/contracts/` isolado, workspaces separando concerns
- **Reutilização** - Funções puas compartilhadas (`statMult`, `expToNext`, `mobExp`)
- **Generics e Tipagem** - `Map<string, EnemySnapshot>`, TypeScript strict, zero `any`
- **Imutabilidade** - Funções puras em `progression.ts`, `skills.data.ts`; mutação controlada no game loop
- **Lei de Demeter** - Violões moderadas no client `world.scene.ts`; métodos seletores recomendados
- **Tell Don't Ask** - Lógica internalizada em `battle-engine.service`; queries no client ainda presentes
- **Sobrecarga** - Não utilizada; optional parameters no lugar de TypeScript overloads
- **Classes Abstratas** - Não usadas; abstração via interfaces + classes concretas
- **Métodos Virtuais** - Por polimorfismo de interface (não keyword `virtual` em TS)
- **Alta Coesão** - Cada classe foco em domínio específico (battle, inventory, academy, etc.)
- **Baixo Acoplamento** - `contracts/` isolado, interfaces para implementações, DI em todo lado

### 📄 FAQ - Perguntas Frequentes

Consulte `docs/FAQ.md` para respostas rápidas sobre:
- Como funciona o combate
- Como subir de nível
- Como me mover
- Como funcionam as batalhas
- O que são os Gates
- Como salvamento funciona
- Identidade no jogo
- Próximos incrementos

### 📊 Métricas do Projeto

| Métrica | Valor |
|---------|-------|
| **Total de Princípios Analisados** | 37 |
| **Arquivos de Documentação** | 19 (15 principles + index + FAQ) |
| **Conformidade Média** | ~80% |
| **Padrões de Projeto** | 7 patternes identificados |
| **SOLID Components** | 5/5 principles aplicados |

### 🚀 Execução

```bash
# Instalação
npm install

# Servidor (terminal 1)
npm run dev:server

# Cliente (terminal 2)
npm run dev:client

# Type checking
npm run typecheck

# Build
npm run build
```

### 📁 Acesso Rápido

- [Código Fonte](https://github.com/walbarellos/sololeveling-rpg)
- [Documentação OOP](docs/)
- [Perguntas Frequentes](docs/FAQ.md)
- [Issues](https://github.com/walbarellos/sololeveling-rpg/issues)
- [Commits](https://github.com/walbarellos/sololeveling-rpg/commits/main)

---

### 📜 Histórico de Análise

A análise abrangeu os seguintes princípios fundamentais de engenharia de software:

1. **Abstração** - Esconder implementações complexas atrás de interfaces simples
2. **Encapsulamento** - Ocultar estado interno, expor apenas o necessário
3. **Herança** - Mecanismo de reutilização (uso limitado neste projeto)
4. **Polimorfismo** - Objetos de classes diferentes respondendo ao mesmo sinal
5. **Composição sobre Herança** - Preferência por combinar objetos vs herdar
6. **SOLID** - Cinco princípios fundamentais de design de software
7. **DRY** - Don't Repeat Yourself (funções puas compartilhadas)
8. **KISS** - Keep It Simple, Stupid (regras diretas)
9. **YAGNI** - You Aren't Gonna Need It (não antecipar features)
10. **Design Patterns** - Padrões reconhecidos (Repository, Strategy, DI, etc.)
11. **Modularidade** - Separação de concerns em pacotes (`contracts/`, `server/`, `client/`)
12. **Reutilização** - Funções puas usadas em múltiplos lugares
13. **Generics e Tipagem** - TypeScript strict, tipos parametrizados
14. **Imutabilidade** - Funções puras vs mutação controlada
15. **Lei de Demeter** - "Talk only to your immediate friends"
16. **Tell Don't Ask** - Fazer o objeto agir, não perguntar dados
17. **Sobrecarga/Sobrescrita** - Análise de absence/presence
18. **Classes Abstratas** - Ausência deliberada (usar interfaces)
18. **Métodos Virtuais** - Polimorfismo por interface implementation
19. **Alta Coesão** - Cada classe foco em domínio específico
20. **Baixo Acoplamento** - Contratos isolados, DI em todo lado

### AUTHOR: WILLIAN ALBARELLO @walbarellos

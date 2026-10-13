# RPG Web Foundation

## 📋 Documentação Estruturada

Este repositório contém a fundação para um RPG browser-based 2D de mundo compartilhado do tipo "Hunter RPG", com mecânicas de grid/tile-based inspiradas em Naruto Game e Solo Leveling.

### 📦 Visão Geral

- **Cliente**: Vite + Phaser 3 + TypeScript
- **Servidor**: NestJS + Socket.IO
- **Contratos Compartilhados**: Zod schemas em `@rpg/contracts`
- **Arquitetura**: Server-authoritative com discrete step protocol e anti-speedhack

### 📁 Estrutura da Documentação

A documentação está organizada em arquivos markdown separados na pasta `docs/`, cada um focado em um princípio ou padrão de projeto específico:

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

```mermaid
graph TD
    subgraph Client ["Apresentação (React + Phaser)"]
        direction TB
        WSC ["WebSocket / Socket.IO"]
        UI ["Interface do Usuário"]
    end

    subgraph Server ["Servidor (NestJS)"]
        direction TB
        GS ["GameService (Orquestração)"]
        BES ["BattleEngineService (Combate)"]
        PS ["PlayerRepository (Persistência)"]
        CL ["Clock (Abstração)"]
    end

    subgraph Contracts ["Camada de Contratos (@rpg/contracts)"]
        direction TB
        ZOD ["Schemas Zod (Fonte de Verdade)"]
        TYPES ["Types TypeScript"]
    end

    UI -->|requisições| WSC
    WSC -->|validação| ZOD
    ZOD --> GS
    GS --> PS
    GS --> CL
    GS --> BES
```

### 🔬 Análise de Princípios Aplicados

A documentação detalhada em `docs/principles/` inclui análise de:

- **Abstração** - Interface `Clock`/`PlayerRepository`, Zod schemas como fonte de verdade
- **Encapsulamento** - `private` em toda lógica crítica, `public` apenas API intencional
- **Herança** - Uso limitado; preferência por composição (`BattleEngineDependencies`)
- **Polimorfismo** - Através de interfaces + type discriminants
- **Composição sobre Herança** - `BattleEngineDependencies`, `CLASS_STATS` registry
- **SOLID** - SRP, OCP, LSP, ISP, DIP (com notas de conformidade ⭐ a ⭐⭐⭐⭐⭐)
- **DRY, KISS, YAGNI** - Avaliação de conformidade e exemplos
- **Design Patterns** - Repository, Strategy, DI, Service, Observer, Adapter, Facade
- **Modularidade e Reutilização** - `packages/contracts/` isolado, functions puas compartilhadas
- **Generics e Tipagem** - TypeScript strict, zero `any`, enumerações
- **Imutabilidade** - Funções puras vs mutação controlada no game loop
- **Lei de Demeter e Tell Don't Ask** - Conformidade e violações identificadas
- **Sobrecarga, Classes Abstratas, Métodos Virtuais** - Análise de ausência/presença
- **Alta Coesão** - Cada classe foco em domínio específico
- **Baixo Acoplamento** - `contracts/` isolado, DI em todo lado

### 📄 FAQ - Perguntas Frequentes

Consulte `docs/FAQ.md` para respostas rápidas sobre:
- Como funciona o combate
- Como subir de nível
- Como me mover
- Como funcionam as batalhas
- O que são os Gates
- Identidade no jogo
- Próximos incrementos

### 📊 Métricas do Projeto

| Métrica | Valor |
|---------|-------|
| **Total de Princípios Analisados** | 37 |
| **Arquivos de Documentação** | 19 (15 principles + index + FAQ) |
| **Linhas de Código Analisadas** | ~4,000+ |
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
15. **Tell Don't Ask** - Fazer o objeto agir, não perguntar dados
16. **Sobrecarga/Sobrescrita** - Análise de absence/presence
17. **Classes Abstratas** - Ausência deliberada (usar interfaces)
18. **Métodos Virtuais** - Polimorfismo por interface implementation
19. **Alta Coesão** - Cada classe foco em domínio específico
20. **Baixo Acoplamento** - Contratos isolados, DI em todo lado

### AUTHOR: WILLIAN ALBARELLO @walbarellos

> **Nota (2026-10-12):** descreve o *primeiro slice*. Hoje a grade do gate E é 48×28 (não 20×12), os ranks vão até SSS+ e há batalha por sessão, missões, inventário, academia e 8 mundos. Estado real e constantes: [domain-map.md](domain-map.md); eventos: [protocol.md](protocol.md). O texto abaixo foi mantido como registro de decisão.

# Architecture overview

## Runtime boundaries
- **Client (Phaser + Vite)**: Input intent (WASD, setas, clique no grid), interpolação suave de apresentação (tweens de 160ms entre tiles), renderização de masmorra, feedback de dano flutuante e UI do caçador.
- **Server (NestJS + Socket.IO)**: Validação autoritativa de passo por direção (`UP`, `DOWN`, `LEFT`, `RIGHT`), anti-speedhack por taxa de passo discreta (`STEP_COOLDOWN_MS`), colisão com obstáculos e limites de mapa, combate adjacente por turnos com dano e contra-ataque.
- **Contracts (Zod + TypeScript)**: Schemas runtime tipados para coordenadas inteiras de tiles, ranks de caçadores (E–S), eventos de passo e combate.
- **Domain**: Regras puras desacopladas de transporte e frameworks, com relógio injetável (`Clock`).
- **Persistence**: Interface `PlayerRepository` com implementação em memória para testes e schema relacional pronto para PostgreSQL (`docs/schemas/schema.sql`).

## Primeira fatia vertical (Tiles & Turnos)
1. Conexão via Socket: servidor vincula identidade do caçador (`Hunter-XXXX`, Rank E, Nv. 1).
2. Servidor emite `game:welcome` com dimensões da grade (20x12 tiles de 48px) e lista de obstáculos.
3. Cliente requisita e recebe `game:snapshot`.
4. Movimentação: cliente envia `game:step` com direção; servidor valida limites, obstáculos e cooldown de passo; cliente faz interpolação visual contínua.
5. Combate: caçador adjacente ao monstro ataca (`game:attack`); servidor valida distância de Chebyshev $\le 1$ e cooldown; causa dano ao alvo e processa contra-ataque de retaliação.
6. Servidor emite `game:combat-log` e snapshot sincronizado do mundo.

## Mundo Vivo por Lazy Evaluation (Simulação Barata)
Em vez de simular o mundo todo a cada tick, regiões e Gates acumulam instabilidade com base no delta de tempo decorrido desde a última avaliação:
`elapsed = now - lastEvaluatedAt`.
Quando um caçador entra na região ou acessa um Gate, o estado é atualizado sob demanda no banco.

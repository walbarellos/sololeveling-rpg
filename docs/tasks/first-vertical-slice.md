# Task card: First vertical slice (Tiles & Turnos)

## Goal
Validar o ciclo completo fim a fim no modelo discreto: conectar caçador, receber grade com obstáculos, dar passos discretos com validação autoritativa, engajar monstro adjacente em combate por turno e observar retaliação de dano.

## Allowed files
- `packages/contracts/**`
- `apps/server/src/domain/**`
- `apps/server/src/realtime/**`
- `apps/client/src/**`

## Acceptance criteria
- Coordenadas de mundo operam estritamente em inteiros (`x, y >= 0`).
- Passos direcionais são validados quanto a limites do mapa e lista de obstáculos.
- Anti-speedhack: tentativas consecutivas de passo em intervalo menor que `STEP_COOLDOWN_MS` são rejeitadas com `"TOO_FAST"`.
- Ataque é rejeitado quando o monstro está a mais de 1 tile de distância ou em cooldown.
- Ataque com sucesso aplica dano no monstro, gera contra-ataque do monstro no caçador se ele sobreviver e emite `game:combat-log`.
- Apresentação do cliente interpola suavemente os movimentos do caçador sem violar a autoridade do servidor.
- `npm run typecheck`, `npm test` e `npm run build` passam com 100% de sucesso.

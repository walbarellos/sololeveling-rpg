# FAQ - RPG Web Foundation

## Como funciona o combate?
O combate é turn-based com adjacência Chebyshev (max(|dx|,|dy|) ≤ 1). O jogador deve estar ao lado do inimigo para atacar. Cada turno tem no máximo 20 turnos.

## Como subir de nível?
EXP é concedido ao final da batalha. Fórmulas: `expToNext(level) = round(40 * level^1.5)`. Monsters dão `mobExp(level) = round(8 * level^1.1)`. Stats multiplicam por `statMult(level) = 1 + 0.09 * (level - 1)`.

## Como me mover?
Use as setas/WASD. Cada passo tem cooldown de 200ms no servidor (anti-speedhack). O cliente espera 215ms entre inputs.

## Como funcionam as batalhas?
Iniciar ao tocar em monstro adjacente ou pressionar [E]. Combate tem 3 tipos de evento: HIT, CRIT, BLOCK, DODGE, HEAL, DEATH. Eventos têm ordem garantida via `logIndex`.

## O que são os Gates?
São 8 mundos progressivos (GATE_E até GATE_SSS) com aumentos de dificuldade, temas diferentes e monstros únicos por rank.

## Como salvamento funciona?
Não há persistência durável. O mundo usa repositório em memória. Estatísticas de carreira são trackeadas mas o mundo reseta na reinicialização do servidor.

## Como funciona a identidade?
O cliente envia uma `playerKey` aleatória no handshake. O servidor hash em `playerId`. Não há autenticação real - é demo apenas.

## O que fazer em cada fase?
- GATE_E (Rank E): Slimes, goblins, níveis 1-3
- GATE_D (Rank D): Wolves, imps, níveis 3-5  
- GATE_C (Rank C): Frost wolves, golems, níveis 20-26
- GATE_B (Rank B): Deathknights, liches, níveis 34-45
- GATE_A (Rank A): Magma drake, fire behemoth, níveis 54-75
- GATE_S (Rank S): Temple guardians, níveis 82-110
- GATE_SS (Rank SS): Stareater, void abomination, níveis 118-145
- GATE_SSS (Rank SSS+): Shadow commander, Kamish, níveis 150-220

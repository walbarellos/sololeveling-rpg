# Índice da documentação

> Roteador: diga a tarefa, abra só o arquivo da linha. Verificado em 2026-10-12 contra o código do zip enviado. Convenção: **número ou nome de constante → fonte no código**; a prosa pode estar defasada.

## Qual arquivo abrir
| Preciso de… | Abrir | Custo |
|---|---|---|
| Regras de trabalho, ADRs 1-13, ownership de arquivos, checks de merge | [AGENTS.md](../AGENTS.md) | ~7 KB |
| Saber "quem trata o evento X" / payload / código de erro | [protocol.md](protocol.md) | ~12 KB |
| Constantes, fórmulas, tabela de exames, mundos, NPCs, riscos | [domain-map.md](domain-map.md) | ~10 KB |
| Como rodar, controles, progressão, identidade, limitações | [README.md](../README.md) | ~8 KB |
| Racional do primeiro slice e mundo vivo por lazy evaluation | [architecture.md](architecture.md) | 2 KB, histórico |
| Critérios de aceite do primeiro slice | [tasks/first-vertical-slice.md](tasks/first-vertical-slice.md) | 1 KB, histórico |

## Fonte da verdade por assunto
| Assunto | Fonte | Não confiar em |
|---|---|---|
| Nomes de eventos e payloads | [`index.ts`](../packages/contracts/src/index.ts) (`ClientEvents`, `ServerEvents`, schemas) | strings soltas no gateway |
| Ranks, teto de nível, EXP | [`base.ts`](../packages/contracts/src/base.ts), [`progression.ts`](../packages/contracts/src/progression.ts) | README/AGENTS antigos ("E–S") |
| Exames de rank e troféus | [`academy.ts`](../packages/contracts/src/academy.ts) | — |
| Missões | [`missions.ts`](../packages/contracts/src/missions.ts) | — |
| Itens, raridades, slots | [`items.ts`](../packages/contracts/src/items.ts) (tipos), [`items.data.ts`](../apps/server/src/domain/items.data.ts) (catálogo) | — |
| Cooldowns, grade, respawn | [`game.service.ts`](../apps/server/src/domain/game.service.ts) (topo do arquivo) | `architecture.md` (20×12) |
| Geometria dos gates | [`worlds.ts`](../apps/server/src/domain/worlds.ts) | — |
| Persistência | [`player.repository.ts`](../apps/server/src/domain/player.repository.ts) | [`schema.sql`](schemas/schema.sql) (defasado) |

## Glossário mínimo
- **Hunter / Caçador**: personagem do jogador. **Rank**: `E…SSS+`, limita o nível (`RANK_CAP`).
- **Gate**: mapa instanciado por rank (`GATE_E…GATE_SSS`) com chefe e portal. **Zona**: destino de teleporte.
- **Tiles & Turnos**: movimento por passos inteiros + combate por turnos. **Slice**: incremento vertical fim a fim.
- **Lazy evaluation**: estado calculado pelo tempo decorrido na leitura, sem timers (respawn de monstros).
- **Troféu**: item dropado por chefe, exigido no exame do rank seguinte.

## Como citar trechos desta documentação
- Projeto inteiro: [`CITATION.cff`](../CITATION.cff) (botão "Cite this repository" no GitHub) e seção "Citing this project" do [README](../README.md).
- Regra específica: permalink de arquivo+linha com SHA do commit, não de branch. Cada tabela de [protocol.md](protocol.md) e [domain-map.md](domain-map.md) já traz links com âncora de linha (`#L<n>`); âncoras de seção são estáveis (`#academia-exames-de-rank`, `#lacunas-e-riscos-verificados`, `#códigos-de-erro`).
- Para DOI: criar release/tag e ativar a integração GitHub–Zenodo.

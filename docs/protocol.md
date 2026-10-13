# Protocolo Socket.IO (contratos → handler → serviço)

> Escopo: tabela única de todos os eventos de transporte. Fonte da verdade dos nomes: `ClientEvents` / `ServerEvents` em [index.ts](../packages/contracts/src/index.ts#L369). Verificado em 2026-10-12 contra o código do zip enviado (26 eventos cliente→servidor, 14 servidor→cliente).
> Use este arquivo em vez de abrir [game.gateway.ts](../apps/server/src/realtime/game.gateway.ts) (550 linhas) só para descobrir "quem trata o evento X".

## Convenções do gateway
- Todo handler faz `Schema.safeParse(body)`; payload inválido → `game:error` com `INVALID_PAYLOAD`.
- O gateway só traduz transporte: a regra mora em [GameService](../apps/server/src/domain/game.service.ts) e nos serviços de domínio ([domain-map.md](domain-map.md)).
- `broadcastSnapshot()` ([game.gateway.ts:535](../apps/server/src/realtime/game.gateway.ts#L535)) envia a **cada socket** o snapshot do mundo **em que aquele jogador está** (`getPlayerWorldId`); custo O(sockets) por mutação.
- Identidade: `playerKey` do handshake → SHA-256, 16 primeiros hex = `playerId` ([identity.ts](../apps/server/src/realtime/identity.ts); sem chave válida cai para o id do socket).

## Cliente → servidor
| Evento | Schema | Handler | Serviço | Efeito |
|---|---|---|---|---|
| `game:snapshot:request` | — | [handleSnapshotRequest](../apps/server/src/realtime/game.gateway.ts#L219) | [GameService.snapshot](../apps/server/src/domain/game.service.ts#L920) | Reenvia `game:snapshot`, o `InventoryState` e a batalha ativa (se houver) só para quem pediu. |
| `game:class:select` | [SelectClassRequestSchema](../packages/contracts/src/index.ts#L119) | [handleSelectClass](../apps/server/src/realtime/game.gateway.ts#L93) | [GameService.selectClass](../apps/server/src/domain/game.service.ts#L360) | Troca a classe (`WARRIOR`, `ASSASSIN`, `MAGE`, `BATTLE_HEALER`). |
| `game:step` | [StepRequestSchema](../packages/contracts/src/index.ts#L114) | [handleStep](../apps/server/src/realtime/game.gateway.ts#L106) | [GameService.step](../apps/server/src/domain/game.service.ts#L374) | Um passo discreto (`UP/DOWN/LEFT/RIGHT`); valida limites, obstáculos e `STEP_COOLDOWN_MS`. |
| `game:attack` | [AttackRequestSchema](../packages/contracts/src/index.ts#L214) | [handleAttack](../apps/server/src/realtime/game.gateway.ts#L205) | [GameService.attack](../apps/server/src/domain/game.service.ts#L550) | Caminho legado de ataque direto (adjacência + `ATTACK_COOLDOWN_MS`); emite `game:combat-log`. |
| `game:battle:start` | [StartBattleRequestSchema](../packages/contracts/src/index.ts#L124) | [handleStartBattle](../apps/server/src/realtime/game.gateway.ts#L125) | [GameService.startBattle](../apps/server/src/domain/game.service.ts#L439) | Abre uma `BattleSession` por turnos contra `targetEnemyId`. |
| `game:battle:action` | [BattleActionRequestSchema](../packages/contracts/src/index.ts#L203) | [handleBattleAction](../apps/server/src/realtime/game.gateway.ts#L148) | [GameService.executeBattleAction](../apps/server/src/domain/game.service.ts#L446) | Executa uma skill no turno; ao terminar emite `game:battle:ended`, inventário e, se for chefe, `game:gate:clear`. |
| `game:battle:flee` | [BattleFleeRequestSchema](../packages/contracts/src/index.ts#L209) | [handleBattleFlee](../apps/server/src/realtime/game.gateway.ts#L186) | [GameService.fleeBattle](../apps/server/src/domain/game.service.ts#L472) | Foge da batalha (sem EXP). |
| `game:item:combat-use` | [UseCombatConsumableRequestSchema](../packages/contracts/src/items.ts#L132) | [handleUseCombatConsumable](../apps/server/src/realtime/game.gateway.ts#L375) | [GameService.useCombatConsumable](../apps/server/src/domain/game.service.ts#L459) | Usa consumível dentro da batalha. |
| `game:mission:list` | — | [handleMissionsRequest](../apps/server/src/realtime/game.gateway.ts#L234) | [GameService.getMissionsState](../apps/server/src/domain/game.service.ts#L604) | Responde `game:mission:state`. |
| `game:mission:start` | [StartMissionRequestSchema](../packages/contracts/src/missions.ts#L45) | [handleStartMission](../apps/server/src/realtime/game.gateway.ts#L239) | [GameService.startMission](../apps/server/src/domain/game.service.ts#L619) | Inicia missão cronometrada (`MISSIONS`). |
| `game:mission:claim` | [ClaimMissionRequestSchema](../packages/contracts/src/missions.ts#L50) | [handleClaimMission](../apps/server/src/realtime/game.gateway.ts#L261) | [GameService.claimMission](../apps/server/src/domain/game.service.ts#L633) | Resgata recompensa; responde `game:mission:claim-result`. |
| `game:mission:cancel` | [CancelMissionRequestSchema](../packages/contracts/src/missions.ts#L55) | [handleCancelMission](../apps/server/src/realtime/game.gateway.ts#L285) | [GameService.cancelMission](../apps/server/src/domain/game.service.ts#L654) | Cancela missão ativa. |
| `game:stats:allocate` | [AllocateStatsRequestSchema](../packages/contracts/src/index.ts#L129) | [handleAllocateStats](../apps/server/src/realtime/game.gateway.ts#L298) | [GameService.allocateStats](../apps/server/src/domain/game.service.ts#L862) | Gasta pontos de atributo (bloqueado em batalha: `CANNOT_ALLOCATE_IN_BATTLE`). |
| `game:inventory:request` | — | [handleInventoryRequest](../apps/server/src/realtime/game.gateway.ts#L320) | [GameService.getInventoryState](../apps/server/src/domain/game.service.ts#L668) | Responde `game:inventory:state`. |
| `game:item:equip` | [EquipItemRequestSchema](../packages/contracts/src/items.ts#L114) | [handleEquipItem](../apps/server/src/realtime/game.gateway.ts#L328) | [GameService.equipItem](../apps/server/src/domain/game.service.ts#L674) | Equipa o item do `slotIndex` (slots: weapon, shield, armor, amulet, ring). |
| `game:item:unequip` | [UnequipItemRequestSchema](../packages/contracts/src/items.ts#L122) | [handleUnequipItem](../apps/server/src/realtime/game.gateway.ts#L347) | [GameService.unequipItem](../apps/server/src/domain/game.service.ts#L690) | Desequipa um slot de equipamento. |
| `game:item:use` | [UseItemRequestSchema](../packages/contracts/src/items.ts#L127) | [handleUseItem](../apps/server/src/realtime/game.gateway.ts#L361) | [GameService.useItem](../apps/server/src/domain/game.service.ts#L706) | Usa consumível fora de batalha. |
| `game:item:sell` | [SellItemRequestSchema](../packages/contracts/src/items.ts#L138) | [handleSellItem](../apps/server/src/realtime/game.gateway.ts#L417) | [GameService.sellItem](../apps/server/src/domain/game.service.ts#L739) | Vende um slot (não vende equipado nem troféu). |
| `game:item:sell-junk` | [SellAllJunkRequestSchema](../packages/contracts/src/items.ts#L143) | [handleSellAllJunk](../apps/server/src/realtime/game.gateway.ts#L431) | [GameService.sellAllJunk](../apps/server/src/domain/game.service.ts#L755) | Vende em lote até uma raridade máxima. |
| `game:academy:promote` | [RankPromotionRequestSchema](../packages/contracts/src/academy.ts#L117) | [handleRankPromotion](../apps/server/src/realtime/game.gateway.ts#L404) | [GameService.promoteRank](../apps/server/src/domain/game.service.ts#L722) | Exame de rank; responde `game:academy:promote-result`. Regras em [domain-map.md](domain-map.md#academia-exames-de-rank). |
| `game:academy:claim-trophy` | [ClaimLostTrophyRequestSchema](../packages/contracts/src/index.ts#L352) | [handleClaimLostTrophy](../apps/server/src/realtime/game.gateway.ts#L483) | [GameService.claimLostTrophy](../apps/server/src/domain/game.service.ts#L844) | Recupera troféu de chefe não resgatado. |
| `game:merchant:buy` | [MerchantBuyRequestSchema](../packages/contracts/src/index.ts#L346) | [handleMerchantBuy](../apps/server/src/realtime/game.gateway.ts#L469) | [GameService.buyMerchantItem](../apps/server/src/domain/game.service.ts#L801) | Compra do Mercador (`NOT_ENOUGH_GOLD` se faltar ouro). |
| `game:zone:teleport` | [ZoneTeleportRequestSchema](../packages/contracts/src/index.ts#L314) | [handleZoneTeleport](../apps/server/src/realtime/game.gateway.ts#L440) | [GameService.teleportPlayerToZone](../apps/server/src/domain/game.service.ts#L768) | Teleporte entre zonas/gates (`ZONE_LOCKED` / `ZONE_NOT_FOUND`). |
| `game:gate:reset` | [ResetGateRequestSchema](../packages/contracts/src/index.ts#L357) | [handleResetGate](../apps/server/src/realtime/game.gateway.ts#L462) | [GameService.resetGate](../apps/server/src/domain/game.service.ts#L786) | Reinicia o gate; anuncia `game:gate:reset-announcement` para todos. |
| `game:shrine:interact` | [ShrineInteractRequestSchema](../packages/contracts/src/index.ts#L333) | [handleShrineInteract](../apps/server/src/realtime/game.gateway.ts#L499) | [GameService.interactWithShrine](../apps/server/src/domain/game.service.ts#L775) | Interage com o altar do mundo atual; responde `game:shrine:interact-result`. |
| `game:dev:set-level` | [DevSetLevelRequestSchema](../packages/contracts/src/index.ts#L360) | [handleDevSetLevel](../apps/server/src/realtime/game.gateway.ts#L518) | [GameService.devSetLevel](../apps/server/src/domain/game.service.ts#L321) | **Dev/cheat, sem gating** — ver [riscos](domain-map.md#lacunas-e-riscos-verificados). |

## Servidor → cliente
| Evento | Schema | Alcance | Conteúdo |
|---|---|---|---|
| `game:welcome` | [WelcomeSchema](../packages/contracts/src/index.ts#L423) | ao conectar | Identidade, dimensões da grade, obstáculos, `worldId`, `style`. |
| `game:snapshot` | [WorldSnapshotSchema](../packages/contracts/src/index.ts#L102) | broadcast | Estado do mundo do jogador; enviado por socket a cada mutação. |
| `game:battle:snapshot` | [BattleSnapshotSchema](../packages/contracts/src/index.ts#L184) | por socket | Estado da batalha com `events[]` ordenados (`logIndex`). |
| `game:battle:ended` | [BattleSnapshotSchema](../packages/contracts/src/index.ts#L184) | por socket | Mesmo payload quando `finished`. |
| `game:combat-log` | [CombatLogSchema](../packages/contracts/src/index.ts#L434) | broadcast | Resultado do ataque legado. |
| `game:error` | [ServerErrorSchema](../packages/contracts/src/index.ts#L264) | por socket | `{ code, message }` com [`ServerErrorCode`](#códigos-de-erro). |
| `game:session:replaced` | — | socket anterior | `{}`; o socket antigo é desconectado (mesmo `?slot` em duas abas). |
| `game:mission:state` | [MissionsStateSchema](../packages/contracts/src/missions.ts#L60) | por socket | Missões disponíveis/ativas. |
| `game:mission:claim-result` | [MissionClaimResultSchema](../packages/contracts/src/missions.ts#L69) | por socket | Resultado do resgate. |
| `game:inventory:state` | [InventoryStateSchema](../packages/contracts/src/items.ts#L107) | por socket | Inventário, equipamento e estatísticas de carreira. |
| `game:academy:promote-result` | [RankPromotionResultSchema](../packages/contracts/src/academy.ts#L122) | por socket | `success`, `newRank`, `message`, `unlockedLevelCap`, `rewardStatPoints`. |
| `game:gate:clear` | [GateClearAnnouncementSchema](../packages/contracts/src/index.ts#L219) | broadcast | Chefe derrotado: `bossName`, `slayerName`, `rewardExp`, `trophyDropped`, `newPortalUnlocked`. |
| `game:gate:reset-announcement` | — | broadcast | `{ message }` (sem schema Zod). |
| `game:shrine:interact-result` | [ShrineInteractResultSchema](../packages/contracts/src/index.ts#L338) | por socket | Resultado da interação com o altar. |

## Códigos de erro
`ServerErrorCode` ([index.ts:228](../packages/contracts/src/index.ts#L228)) tem 32 valores:
`INVALID_PAYLOAD`, `OUT_OF_BOUNDS`, `OBSTACLE`, `TOO_FAST`, `TARGET_UNAVAILABLE`, `TOO_FAR`, `COOLDOWN`, `NOT_ENOUGH_MP`, `SKILL_ON_COOLDOWN`, `BATTLE_NOT_FOUND`, `ALREADY_IN_BATTLE`, `NOT_IN_BATTLE`, `MISSION_NOT_FOUND`, `MISSION_LOCKED`, `MISSION_ALREADY_ACTIVE`, `NO_ACTIVE_MISSION`, `MISSION_IN_PROGRESS`, `MISSION_ALREADY_CLAIMED`, `MAX_ACTIVE_MISSIONS_REACHED`, `INSUFFICIENT_STAT_POINTS`, `CANNOT_ALLOCATE_IN_BATTLE`, `ITEM_NOT_FOUND`, `CANNOT_EQUIP`, `INSUFFICIENT_LEVEL_FOR_ITEM`, `CONSUMABLE_CHARGES_EXHAUSTED`, `ACADEMY_REQUIREMENTS_UNMET`, `NOT_ENOUGH_GOLD`, `CANNOT_SELL_EQUIPPED`, `CANNOT_SELL_TROPHY`, `ZONE_NOT_FOUND`, `ZONE_LOCKED`, `NPC_NOT_FOUND`.

Regra de agente: erro novo = adicionar ao enum em `packages/contracts`, nunca string solta no gateway (ver [AGENTS.md](../AGENTS.md#coding-rules)).

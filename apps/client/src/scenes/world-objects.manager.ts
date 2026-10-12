import Phaser from "phaser";
import {
  ClientEvents,
  WORLD_NPCS,
  isRankAllowed,
  type HunterRank,
  type NpcDefinition,
  type TileCoord,
  type ZoneTeleportRequest
} from "@rpg/contracts";
import { TEX } from "../assets";
import { socket } from "../network/game-socket";
import { gameState, getMyPlayer } from "../state/game-state";
import { hudController } from "../ui/hud.controller";
import { npcController } from "../ui/npc.controller";

export interface WorldPortal {
  x: number;
  y: number;
  label: string;
  zoneId: ZoneTeleportRequest["zoneId"];
  minRank?: HunterRank;
  color: string;
  tint?: number;
  prevBossId?: string;
  prevTrophyId?: string;
}

export interface WorldShrineDef {
  id: string;
  name: string;
  x: number;
  y: number;
}

const chebyshev = (a: TileCoord, b: TileCoord) => Math.max(Math.abs(a.x - b.x), Math.abs(a.y - b.y));
const manhattan = (a: TileCoord, b: TileCoord) => Math.abs(a.x - b.x) + Math.abs(a.y - b.y);

export class WorldObjectsManager {
  public portalObjects: Phaser.GameObjects.GameObject[] = [];
  public npcObjects: Phaser.GameObjects.Container[] = [];
  public currentPortals: WorldPortal[] = [];
  public shrineObjects: Phaser.GameObjects.GameObject[] = [];
  public currentShrines: WorldShrineDef[] = [];
  private lastPortalStepAt = 0;
  private lastShrineInteractAt = 0;

  constructor(private readonly scene: Phaser.Scene) {}

  public rebuildWorldObjects(prefersReducedMotion: boolean) {
    for (const obj of this.portalObjects) obj.destroy();
    this.portalObjects = [];
    for (const cont of this.npcObjects) cont.destroy();
    this.npcObjects = [];
    for (const obj of this.shrineObjects) obj.destroy();
    this.shrineObjects = [];

    const ts = gameState.tileSize || 48;
    const wId = gameState.worldId;

    if (wId === "GATE_D") {
      this.currentPortals = [
        { x: 3, y: 4, label: "RETORNO SANTUÁRIO", zoneId: "RETURN_GATE_E", color: "#7dd3fc" },
        {
          x: 41,
          y: 6,
          label: "PORTAL GATE C (GLACIAL)",
          zoneId: "ENTER_GATE_C",
          minRank: "C",
          color: "#38bdf8",
          tint: 0x38bdf8,
          prevBossId: "boss_crimson_sentinel",
          prevTrophyId: "trophy_crimson_heart"
        }
      ];
      this.currentShrines = [
        { id: "shrine_d1", name: "Altar de Rubi do Átrio", x: 3, y: 15 },
        { id: "shrine_d2", name: "Fonte de Mana de Latão", x: 22, y: 5 }
      ];
    } else if (wId === "GATE_C") {
      this.currentPortals = [
        { x: 3, y: 4, label: "RETORNO SANTUÁRIO", zoneId: "RETURN_GATE_E", color: "#7dd3fc" },
        {
          x: 45,
          y: 6,
          label: "PORTAL GATE B (SOMBRAS)",
          zoneId: "ENTER_GATE_B",
          minRank: "B",
          color: "#a855f7",
          tint: 0xa855f7,
          prevBossId: "boss_frost_queen",
          prevTrophyId: "trophy_frost_queen_crystal"
        }
      ];
      this.currentShrines = [
        { id: "shrine_c1", name: "Monólito de Permafrost", x: 4, y: 18 },
        { id: "shrine_c2", name: "Fonte Glacial de Niflheim", x: 28, y: 6 }
      ];
    } else if (wId === "GATE_B") {
      this.currentPortals = [
        { x: 4, y: 4, label: "RETORNO SANTUÁRIO", zoneId: "RETURN_GATE_E", color: "#7dd3fc" },
        {
          x: 49,
          y: 7,
          label: "PORTAL GATE A (MAGMA)",
          zoneId: "ENTER_GATE_A",
          minRank: "A",
          color: "#f97316",
          tint: 0xf97316,
          prevBossId: "boss_shadow_lich",
          prevTrophyId: "trophy_shadow_lich_skull"
        }
      ];
      this.currentShrines = [
        { id: "shrine_b1", name: "Obelisco das Almas", x: 5, y: 20 },
        { id: "shrine_b2", name: "Cripta de Mana Espectral", x: 32, y: 7 }
      ];
    } else if (wId === "GATE_A") {
      this.currentPortals = [
        { x: 4, y: 5, label: "RETORNO SANTUÁRIO", zoneId: "RETURN_GATE_E", color: "#7dd3fc" },
        {
          x: 53,
          y: 8,
          label: "PORTAL GATE S (TEMPLO)",
          zoneId: "ENTER_GATE_S",
          minRank: "S",
          color: "#facc15",
          tint: 0xfacc15,
          prevBossId: "boss_dragon_ignis",
          prevTrophyId: "trophy_dragon_heart"
        }
      ];
      this.currentShrines = [
        { id: "shrine_a1", name: "Fonte de Fogo Vivo", x: 5, y: 22 },
        { id: "shrine_a2", name: "Altar Vulcânico de Obsidiana", x: 34, y: 8 }
      ];
    } else if (wId === "GATE_S") {
      this.currentPortals = [
        { x: 5, y: 5, label: "RETORNO SANTUÁRIO", zoneId: "RETURN_GATE_E", color: "#7dd3fc" },
        {
          x: 57,
          y: 9,
          label: "PORTAL GATE SS (VÁCUO)",
          zoneId: "ENTER_GATE_SS",
          minRank: "SS",
          color: "#ec4899",
          tint: 0xec4899,
          prevBossId: "boss_god_statue",
          prevTrophyId: "trophy_god_statue_fragment"
        }
      ];
      this.currentShrines = [
        { id: "shrine_s1", name: "Altar Sagrado da Aurora", x: 6, y: 24 },
        { id: "shrine_s2", name: "Pilar dos Mandamentos Divinos", x: 38, y: 9 }
      ];
    } else if (wId === "GATE_SS") {
      this.currentPortals = [
        { x: 5, y: 5, label: "RETORNO SANTUÁRIO", zoneId: "RETURN_GATE_E", color: "#7dd3fc" },
        {
          x: 61,
          y: 9,
          label: "PORTAL GATE SSS+ (MONARCA)",
          zoneId: "ENTER_GATE_SSS",
          minRank: "SSS",
          color: "#8b5cf6",
          tint: 0x8b5cf6,
          prevBossId: "boss_cosmic_avatar",
          prevTrophyId: "trophy_cosmic_core"
        }
      ];
      this.currentShrines = [
        { id: "shrine_ss1", name: "Fóton Cósmico de Cura", x: 6, y: 26 },
        { id: "shrine_ss2", name: "Nebulosa Astral de Mana", x: 42, y: 10 }
      ];
    } else if (wId === "GATE_SSS") {
      this.currentPortals = [
        { x: 6, y: 5, label: "RETORNO SANTUÁRIO", zoneId: "RETURN_GATE_E", color: "#7dd3fc" },
        { x: 65, y: 10, label: "SANTUÁRIO CENTRAL", zoneId: "RETURN_GATE_E", color: "#8b5cf6", tint: 0x8b5cf6 }
      ];
      this.currentShrines = [
        { id: "shrine_sss1", name: "Chama Eterna do Soberano", x: 7, y: 28 },
        { id: "shrine_sss2", name: "Altar da Morte Suprema", x: 46, y: 11 }
      ];
    } else {
      const me = getMyPlayer();
      const rank = me?.rank ?? "E";
      const highestPortal = this.getHighestGatePortalForRank(rank);

      // No Santuário do Gate E, o Portal de Incursão Ativa fica na plataforma leste (12, 3), ao lado do Operador Jin (10, 3)
      this.currentPortals = [highestPortal];

      this.currentShrines = [
        { id: "shrine_e1", name: "Fonte de Mana do Santuário", x: 6, y: 6 },
        { id: "shrine_e2", name: "Altar das Sombras", x: 38, y: 15 }
      ];

      // Spawn dos NPCs no Santuário Seguro do Gate E
      for (const npc of WORLD_NPCS) {
        const px = npc.position.x * ts + ts / 2;
        const py = npc.position.y * ts + ts / 2;
        const tokenKey = TEX.token(npc.portrait as any);

        const cont = this.scene.add.container(px, py).setDepth(20);
        const spr = this.scene.add.image(0, 0, tokenKey).setDisplaySize(ts * 0.85, ts * 0.85);

        const badge = this.scene.add
          .text(0, -ts * 0.65, `[NPC] ${npc.name}`, {
            fontSize: "9px",
            fontFamily: "'Rajdhani', sans-serif",
            fontStyle: "bold",
            color: "#38bdf8",
            backgroundColor: "#030712dd",
            padding: { x: 4, y: 1 }
          })
          .setOrigin(0.5);

        cont.add([spr, badge]);

        if (!prefersReducedMotion) {
          this.scene.tweens.add({
            targets: spr,
            y: { from: -1, to: 1 },
            duration: 1200,
            yoyo: true,
            repeat: -1,
            ease: "Sine.easeInOut"
          });
        }
        this.npcObjects.push(cont);
      }
    }

    // Criação dos portais visuais
    for (const portal of this.currentPortals) {
      const px = portal.x * ts + ts / 2;
      const py = portal.y * ts + ts / 2;
      const spr = this.scene.add
        .image(px, py, TEX.portal)
        .setDepth(1)
        .setAlpha(0.95)
        .setDisplaySize(ts, ts);
      if (portal.tint) spr.setTint(portal.tint);

      const label = this.scene.add
        .text(px, py + ts * 0.58, portal.label, {
          fontSize: "8.5px",
          fontFamily: "'Rajdhani', sans-serif",
          fontStyle: "bold",
          color: portal.color,
          backgroundColor: "#030712ee",
          padding: { x: 5, y: 2 },
          align: "center",
          stroke: "#020617",
          strokeThickness: 2
        })
        .setOrigin(0.5)
        .setDepth(20);

      this.portalObjects.push(spr, label);

      if (!prefersReducedMotion) {
        this.scene.tweens.add({ targets: spr, angle: 360, duration: 9000, repeat: -1 });
        this.scene.tweens.add({
          targets: spr,
          scale: { from: 0.94, to: 1.06 },
          yoyo: true,
          duration: 1400,
          repeat: -1,
          ease: "Sine.easeInOut"
        });
      }
    }

    // Criação dos Altares de Restauração visuais
    for (const shrine of this.currentShrines) {
      const px = shrine.x * ts + ts / 2;
      const py = shrine.y * ts + ts / 2;
      const spr = this.scene.add
        .image(px, py, TEX.shrine)
        .setDepth(2)
        .setDisplaySize(ts, ts);

      const label = this.scene.add
        .text(px, py - ts * 0.55, shrine.name, {
          fontSize: "8.5px",
          fontFamily: "'Rajdhani', sans-serif",
          fontStyle: "bold",
          color: "#38bdf8",
          backgroundColor: "#030712cc",
          padding: { x: 4, y: 1 }
        })
        .setOrigin(0.5)
        .setDepth(2);

      this.shrineObjects.push(spr, label);

      if (!prefersReducedMotion) {
        this.scene.tweens.add({
          targets: spr,
          y: { from: py - 1, to: py + 1 },
          duration: 1600,
          yoyo: true,
          repeat: -1,
          ease: "Sine.easeInOut"
        });
      }
    }
  }

  public adjacentPortals(): WorldPortal[] {
    const me = getMyPlayer();
    if (!me) return [];
    return this.currentPortals.filter((p) => chebyshev(me.position, p) <= 1);
  }

  public adjacentShrines(): WorldShrineDef[] {
    const me = getMyPlayer();
    if (!me) return [];
    return this.currentShrines.filter((s) => chebyshev(me.position, s) <= 1);
  }

  public adjacentNpcs(): NpcDefinition[] {
    const me = getMyPlayer();
    if (!me || gameState.worldId !== "GATE_E") return [];
    return (WORLD_NPCS as NpcDefinition[])
      .filter((n) => chebyshev(me.position, n.position) <= 1)
      .sort((a, b) => manhattan(me.position, a.position) - manhattan(me.position, b.position));
  }

  public activatePortal(portal: WorldPortal, onCancelPursuit: () => void) {
    const me = getMyPlayer();
    if (!me || me.inBattle || gameState.currentBattle) return;
    const now = Date.now();
    if (now - this.lastPortalStepAt < 1000) return;
    this.lastPortalStepAt = now;
    onCancelPursuit();

    // Verificação permissiva: o servidor tem a autoridade final (TeleportService valida rank OR boss morto OR troféu)
    const bossDead = portal.prevBossId ? !gameState.world.enemies.find((e) => e.id === portal.prevBossId)?.alive : false;
    const hasTrophy = portal.prevTrophyId ? gameState.inventory.some((s) => s.item.id === portal.prevTrophyId) : false;
    const rankAllowed = portal.minRank ? isRankAllowed(me.rank, portal.minRank) : true;

    if (!rankAllowed && !bossDead && !hasTrophy) {
      hudController.setStatus(
        `Portal bloqueado: Requer Rank ${portal.minRank} ou abolição do Chefe do Gate! Fale com o Inspetor Baek.`
      );
      return;
    }

    hudController.setStatus(`Sintonizando portal dimensional [${portal.label.replace("\n", " - ")}]…`);
    socket.emit(ClientEvents.ZoneTeleportRequest, { zoneId: portal.zoneId });
  }

  public activateShrine(shrine: WorldShrineDef, onCancelPursuit: () => void) {
    const me = getMyPlayer();
    if (!me || me.inBattle || gameState.currentBattle) return;
    const now = Date.now();
    if (now - this.lastShrineInteractAt < 1000) return;
    this.lastShrineInteractAt = now;
    onCancelPursuit();
    hudController.setStatus(`Canalizando energia sagrada no [${shrine.name}]…`);
    socket.emit(ClientEvents.ShrineInteractRequest);
  }

  private getHighestGatePortalForRank(rank: HunterRank): WorldPortal {
    if (isRankAllowed(rank, "SSS")) {
      return { x: 12, y: 3, label: "[PORTAL MONARCA]\nGATE SSS+ (TRONO)", zoneId: "ENTER_GATE_SSS", minRank: "SSS", color: "#67e8f9", tint: 0x22d3ee };
    }
    if (isRankAllowed(rank, "SS")) {
      return { x: 12, y: 3, label: "[PORTAL CÓSMICO]\nGATE SS (VÁCUO)", zoneId: "ENTER_GATE_SS", minRank: "SS", color: "#f472b6", tint: 0xec4899 };
    }
    if (isRankAllowed(rank, "S")) {
      return { x: 12, y: 3, label: "[PORTAL TEMPLO]\nGATE S (DEUSES)", zoneId: "ENTER_GATE_S", minRank: "S", color: "#fef08a", tint: 0xfacc15 };
    }
    if (isRankAllowed(rank, "A")) {
      return { x: 12, y: 3, label: "[PORTAL VULCÂNICO]\nGATE A (MAGMA)", zoneId: "ENTER_GATE_A", minRank: "A", color: "#fca5a5", tint: 0xf43f5e };
    }
    if (isRankAllowed(rank, "B")) {
      return { x: 12, y: 3, label: "[PORTAL NECRÓPOLE]\nGATE B (SOMBRAS)", zoneId: "ENTER_GATE_B", minRank: "B", color: "#e9d5ff", tint: 0xa855f7 };
    }
    if (isRankAllowed(rank, "C")) {
      return { x: 12, y: 3, label: "[PORTAL GLACIAL]\nGATE C (NIFLHEIM)", zoneId: "ENTER_GATE_C", minRank: "C", color: "#7dd3fc", tint: 0x38bdf8 };
    }
    return {
      x: 12,
      y: 3,
      label: "[PORTAL CARMESIM]\nGATE D (CIDADELA)",
      zoneId: "ENTER_GATE_D",
      minRank: "D",
      color: "#6ee7b7",
      tint: 0x10b981,
      prevBossId: "boss-1",
      prevTrophyId: "trophy_goblin_boss_core"
    };
  }
}

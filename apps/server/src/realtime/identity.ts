import { createHash } from "node:crypto";
import { HandshakeAuthSchema } from "@rpg/contracts";

/**
 * Deriva o playerId estável a partir da chave enviada no handshake.
 * Só o hash circula no mundo (snapshots são broadcast), então a chave não vaza para outros jogadores.
 * Sem chave válida, cai para o id do socket (personagem efêmero, como antes).
 *
 * Demo sem autenticação real: quem tiver a chave controla o personagem.
 */
export function resolvePlayerId(auth: unknown, socketId: string): string {
  const parsed = HandshakeAuthSchema.safeParse(auth);
  if (!parsed.success) return socketId;
  return createHash("sha256").update(parsed.data.playerKey).digest("hex").slice(0, 16);
}

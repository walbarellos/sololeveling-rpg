import { io, type Socket } from "socket.io-client";

export const SERVER_URL = import.meta.env.VITE_SERVER_URL ?? "http://localhost:3000";

/**
 * Identidade persistente (demo, sem login): chave aleatória no localStorage, enviada no handshake.
 * `?slot=2` abre um segundo personagem local no mesmo navegador. Sem storage, o personagem é efêmero.
 */
export function loadPlayerKey(): string {
  const slot = (new URLSearchParams(location.search).get("slot") ?? "0").replace(/[^\w-]/g, "").slice(0, 16) || "0";
  const storageKey = `hunter-rpg:player-key:${slot}`;
  try {
    const existing = localStorage.getItem(storageKey);
    if (existing && /^[a-f0-9]{32}$/.test(existing)) return existing;
    const bytes = crypto.getRandomValues(new Uint8Array(16));
    const key = Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
    localStorage.setItem(storageKey, key);
    return key;
  } catch {
    return "";
  }
}

export const playerKey = loadPlayerKey();

export const socket: Socket = io(SERVER_URL, {
  transports: ["websocket", "polling"],
  auth: playerKey ? { playerKey } : {}
});

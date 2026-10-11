import { describe, expect, it } from "vitest";
import { resolvePlayerId } from "./identity";

const KEY_A = "a".repeat(32);
const KEY_B = "b".repeat(32);

describe("resolvePlayerId", () => {
  it("é estável por chave e não expõe a chave", () => {
    const id1 = resolvePlayerId({ playerKey: KEY_A }, "sock-1");
    const id2 = resolvePlayerId({ playerKey: KEY_A }, "sock-2");
    expect(id1).toBe(id2);
    expect(id1).toHaveLength(16);
    expect(KEY_A).not.toContain(id1);
  });

  it("chaves diferentes geram personagens diferentes", () => {
    expect(resolvePlayerId({ playerKey: KEY_A }, "s")).not.toBe(resolvePlayerId({ playerKey: KEY_B }, "s"));
  });

  it("sem chave válida cai para o id do socket (efêmero)", () => {
    expect(resolvePlayerId({}, "sock-1")).toBe("sock-1");
    expect(resolvePlayerId(undefined, "sock-1")).toBe("sock-1");
    expect(resolvePlayerId({ playerKey: "curta" }, "sock-1")).toBe("sock-1");
  });
});

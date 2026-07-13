import { createServerFn } from "@tanstack/react-start";
import { clearSession, getSession, updateSession } from "@tanstack/react-start/server";
import { z } from "zod";
import {
  createGateToken,
  getSessionConfig,
  passwordMatches,
  verifyGateToken,
  type GateSession,
} from "./gate.server";

export const checkUnlocked = createServerFn({ method: "GET" }).handler(async () => {
  try {
    const session = await getSession<GateSession>(getSessionConfig());
    return { unlocked: Boolean(session.data.unlocked) };
  } catch {
    return { unlocked: false };
  }
});

export const unlockSite = createServerFn({ method: "POST" })
  .inputValidator((input) => z.object({ password: z.string().min(1).max(200) }).parse(input))
  .handler(async ({ data }) => {
    const expected = process.env.SITE_PASSWORD;
    if (!expected) throw new Error("SITE_PASSWORD is not set");
    if (!passwordMatches(data.password, expected)) {
      return { ok: false as const };
    }
    try {
      await updateSession<GateSession>(getSessionConfig(), { unlocked: true });
    } catch {
      // Lovable/webview cookie sessions can fail when envs or browser storage are in flux.
      // The signed fallback token below still keeps the admin locked behind SITE_PASSWORD.
    }
    return { ok: true as const, token: createGateToken() };
  });

export const checkUnlockToken = createServerFn({ method: "POST" })
  .inputValidator((input) => z.object({ token: z.string().min(1).max(1000) }).parse(input))
  .handler(async ({ data }) => ({ unlocked: verifyGateToken(data.token) }));

export const lockSite = createServerFn({ method: "POST" }).handler(async () => {
  try {
    await clearSession(getSessionConfig());
  } catch {
    // If the cookie session is unavailable, the client-side token is cleared by navigation/logout.
  }
  return { ok: true as const };
});

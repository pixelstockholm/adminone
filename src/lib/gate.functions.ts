import { createServerFn } from "@tanstack/react-start";
import { clearSession, getSession, updateSession } from "@tanstack/react-start/server";
import { z } from "zod";
import { getSessionConfig, passwordMatches, type GateSession } from "./gate.server";

export const checkUnlocked = createServerFn({ method: "GET" }).handler(async () => {
  const session = await getSession<GateSession>(getSessionConfig());
  return { unlocked: Boolean(session.data.unlocked) };
});

export const unlockSite = createServerFn({ method: "POST" })
  .inputValidator((input) => z.object({ password: z.string().min(1).max(200) }).parse(input))
  .handler(async ({ data }) => {
    const expected = process.env.SITE_PASSWORD;
    if (!expected) throw new Error("SITE_PASSWORD is not set");
    if (!passwordMatches(data.password, expected)) {
      return { ok: false as const };
    }
    await updateSession<GateSession>(getSessionConfig(), { unlocked: true });
    return { ok: true as const };
  });

export const lockSite = createServerFn({ method: "POST" }).handler(async () => {
  await clearSession(getSessionConfig());
  return { ok: true as const };
});

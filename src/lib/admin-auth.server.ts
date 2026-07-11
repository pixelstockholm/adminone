import { useSession as getSession } from "@tanstack/react-start/server";

type GateSession = { unlocked?: boolean };

export async function requireUnlockedAdmin(): Promise<void> {
  const password = process.env.SESSION_SECRET;
  if (!password) throw new Error("SESSION_SECRET is not set");
  const session = await getSession<GateSession>({
    password,
    name: "racepace-gate",
    maxAge: 60 * 60 * 24 * 7,
    cookie: {
      httpOnly: true,
      secure: true,
      sameSite: "lax",
      path: "/",
    },
  });
  if (!session.data.unlocked) throw new Error("Unauthorized");
}

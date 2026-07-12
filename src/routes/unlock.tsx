import { createFileRoute, redirect, useRouter } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { Loader2, Lock } from "lucide-react";
import { checkUnlocked, checkUnlockToken, unlockSite } from "@/lib/gate.functions";

export const Route = createFileRoute("/unlock")({
  head: () => ({
    meta: [
      { title: "Unlock · Racepace Admin" },
      { name: "robots", content: "noindex,nofollow" },
    ],
  }),
  beforeLoad: async () => {
    const { unlocked } = await checkUnlocked();
    if (unlocked) throw redirect({ to: "/" });
    if (typeof window !== "undefined") {
      const token = window.localStorage.getItem("racepace-gate-token");
      if (token) {
        const fallback = await checkUnlockToken({ data: { token } });
        if (fallback.unlocked) throw redirect({ to: "/" });
        window.localStorage.removeItem("racepace-gate-token");
      }
    }
  },
  component: UnlockPage,
});

function UnlockPage() {
  const router = useRouter();
  const unlock = useServerFn(unlockSite);
  const [password, setPassword] = useState("");
  const [error, setError] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSubmitting(true);
    setError(false);
    try {
      const { ok, token } = await unlock({ data: { password } });
      if (ok) {
        window.localStorage.setItem("racepace-gate-token", token);
        await router.invalidate();
        await router.navigate({ to: "/" });
      } else {
        setError(true);
        setPassword("");
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen w-full flex items-center justify-center px-4 bg-background">
      <div className="w-full max-w-sm">
        <div className="flex flex-col items-center mb-8">
          <div className="h-11 w-11 rounded-xl bg-foreground text-background flex items-center justify-center mb-4">
            <Lock className="h-5 w-5" />
          </div>
          <h1 className="text-xl font-semibold tracking-tight">Racepace Admin</h1>
          <p className="text-sm text-muted-foreground mt-1">Enter access code to continue</p>
        </div>

        <form onSubmit={onSubmit} className="surface-card p-5 space-y-4">
          <div>
            <label htmlFor="password" className="text-xs uppercase tracking-widest text-muted-foreground font-medium">
              Access code
            </label>
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              autoFocus
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-2 w-full h-10 px-3 rounded-md bg-background border border-border text-sm font-mono tabular-nums tracking-widest focus:outline-none focus:ring-2 focus:ring-foreground/20 focus:border-foreground/40 transition"
            />
            {error && (
              <p className="text-xs text-destructive mt-2">Incorrect code. Try again.</p>
            )}
          </div>

          <button
            type="submit"
            disabled={submitting || password.length === 0}
            className="w-full h-10 rounded-md bg-foreground text-background text-sm font-medium hover:opacity-90 transition disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center justify-center gap-2"
          >
            {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            Enter dashboard
          </button>
        </form>

        <p className="text-[11px] text-center text-muted-foreground mt-6">
          You'll stay signed in on this device for 7 days.
        </p>
      </div>
    </div>
  );
}

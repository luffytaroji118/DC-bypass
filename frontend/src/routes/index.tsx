import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { AnimatedBackground } from "@/components/AnimatedBackground";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "DoubleCounter Bypass — Paste a link, get a result" },
      {
        name: "description",
        content:
          "A minimal single-field tool interface: paste a DoubleCounter URL or code and submit it.",
      },
      { property: "og:title", content: "DoubleCounter Bypass" },
      {
        property: "og:description",
        content: "A minimal single-field tool interface for DoubleCounter links and codes.",
      },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "/" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [{ rel: "canonical", href: "/" }],
  }),
  component: Index,
});

const API_BASE =
  (import.meta.env.VITE_API_BASE as string | undefined)?.replace(/\/$/, "") ||
  "https://dc-bypass-production-3408.up.railway.app";

type Status =
  | { kind: "idle" }
  | { kind: "running"; label: string }
  | { kind: "error"; message: string }
  | { kind: "ok"; message: string; userid?: string };

type SolveEvent =
  | { step: "queued" | "loading" | "solving" | "verifying"; message: string }
  | { step: "done"; success: boolean; message?: string; userid?: string }
  | { step: "error"; message: string };

function toFullUrl(input: string): string | null {
  const v = input.trim();
  if (!v) return null;
  if (/^https?:\/\//i.test(v)) return v;
  if (/^[A-Za-z0-9_-]{4,}$/.test(v)) return `https://beta.doublecounter.gg/v/${v}`;
  const code = v.includes("/") ? v.split("/").filter(Boolean).pop() ?? "" : v;
  if (/^[A-Za-z0-9_-]{4,}$/.test(code)) return `https://beta.doublecounter.gg/v/${code}`;
  return null;
}

function Index() {
  const [value, setValue] = useState("");
  const [status, setStatus] = useState<Status>({ kind: "idle" });
  const esRef = useRef<EventSource | null>(null);
  const doneRef = useRef(false);

  useEffect(() => () => esRef.current?.close(), []);

  function closeStream() {
    esRef.current?.close();
    esRef.current = null;
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const full = toFullUrl(value);
    if (!full) {
      setStatus({ kind: "error", message: "Enter a valid DoubleCounter URL or code." });
      return;
    }

    closeStream();
    doneRef.current = false;
    setStatus({ kind: "running", label: "Verifying..." });

    const es = new EventSource(`${API_BASE}/api/solve?link=${encodeURIComponent(full)}`);
    esRef.current = es;

    es.onmessage = (ev) => {
      if (doneRef.current) return;
      let data: SolveEvent;
      try {
        data = JSON.parse(ev.data) as SolveEvent;
      } catch {
        return;
      }

      if (data.step === "done") {
        doneRef.current = true;
        closeStream();
        if (data.success) {
          setStatus({ kind: "ok", message: "VERIFIED" });
        } else {
          setStatus({ kind: "error", message: "Something went wrong. Please try again." });
        }
      } else if (data.step === "error") {
        doneRef.current = true;
        closeStream();
        setStatus({ kind: "error", message: "Something went wrong. Please try again." });
      }
    };

    es.onerror = () => {
      if (doneRef.current) return;
      closeStream();
      setStatus({ kind: "error", message: "Something went wrong. Please try again." });
    };
  }

  const running = status.kind === "running";

  return (
    <main className="relative flex min-h-screen items-center justify-center px-5 py-16">
      <AnimatedBackground />

      <section className="glass-card w-full max-w-[33rem] rounded-3xl px-8 py-11 sm:px-12 sm:py-14">
        <h1 className="text-center font-display text-4xl leading-tight tracking-tight text-foreground sm:text-5xl">
          DoubleCounter Bypass
        </h1>
        <p className="mt-3 text-center text-base text-muted-foreground">
          bypass the doublecounter discord bot
        </p>

        <form onSubmit={handleSubmit} className="mt-10">
          <label
            htmlFor="dc-input"
            className="block text-xs font-medium uppercase tracking-[0.14em] text-muted-foreground"
          >
            DoubleCounter URL or code
          </label>

          <input
            id="dc-input"
            value={value}
            onChange={(e) => {
              setValue(e.target.value);
              setStatus({ kind: "idle" });
            }}
            placeholder="https://beta.doublecounter.gg/v/********"
            autoComplete="off"
            spellCheck={false}
            disabled={running}
            className="mt-3 w-full rounded-2xl border border-border bg-input px-5 py-4 text-base text-foreground placeholder:text-muted-foreground/70 outline-none transition-colors focus:border-ring focus:bg-input/80 disabled:opacity-60"
          />

          <button
            type="submit"
            disabled={running}
            className="mt-6 flex w-full items-center justify-center gap-2 rounded-2xl bg-primary px-5 py-4 font-display text-base text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-60"
          >
            {running && (
              <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
            )}
            {running ? "Working..." : "Submit"}
          </button>

          {status.kind !== "idle" && (
            <div
              role="status"
              className={`mt-4 text-center text-sm ${
                status.kind === "error"
                  ? "text-destructive"
                  : status.kind === "ok"
                    ? "text-accent-foreground"
                    : "text-muted-foreground"
              }`}
            >
              {status.kind === "running" && (
                <span className="inline-flex items-center gap-2">
                  <span className="inline-block h-3 w-3 animate-spin rounded-full border-2 border-current border-t-transparent" />
                  {status.label}
                </span>
              )}
              {status.kind === "error" && status.message}
              {status.kind === "ok" && status.message}
            </div>
          )}
        </form>

        <div className="mt-10 border-t border-border pt-5 text-center text-sm text-muted-foreground">
          created by{" "}
          <a href="#" className="font-medium text-foreground underline underline-offset-4">
            Lret
          </a>
          <span className="px-2 opacity-60">·</span>
          <a
            href="https://discord.gg/L"
            className="font-medium text-foreground underline underline-offset-4"
          >
            discord.gg/L
          </a>
        </div>
      </section>
    </main>
  );
}

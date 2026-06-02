"use client";

// Mina's "presence" — a single orb that reflects her state so the user always
// knows what she's doing (the PRD's idle / listening / thinking / speaking).

export type MinaState = "idle" | "listening" | "thinking" | "speaking";

const LABEL: Record<MinaState, string> = {
  idle: "At your service.",
  listening: "Listening…",
  thinking: "One moment…",
  speaking: "Speaking…",
};

export default function MinaOrb({ state }: { state: MinaState }) {
  return (
    <div className="flex flex-col items-center gap-4 select-none">
      <div className="relative h-28 w-28">
        {/* ripple rings while listening */}
        {state === "listening" && (
          <>
            <span className="absolute inset-0 rounded-full bg-mina-accent/30 animate-ripple" />
            <span
              className="absolute inset-0 rounded-full bg-mina-accent/20 animate-ripple"
              style={{ animationDelay: "0.6s" }}
            />
          </>
        )}
        {/* the core */}
        <div
          className={[
            "absolute inset-3 rounded-full",
            "bg-gradient-to-br from-mina-accent to-teal-600",
            "shadow-[0_0_40px_-5px] shadow-mina-accent/60",
            state === "idle" ? "animate-breathe" : "",
            state === "speaking" ? "animate-breathe" : "",
            state === "thinking" ? "animate-pulse" : "",
          ].join(" ")}
        />
        {/* thinking spinner ring */}
        {state === "thinking" && (
          <span className="absolute inset-0 rounded-full border-2 border-transparent border-t-mina-accent animate-spin" />
        )}
      </div>
      <p className="text-sm text-mina-muted h-5">{LABEL[state]}</p>
    </div>
  );
}

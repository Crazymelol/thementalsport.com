"use client";

export type MinaState = "idle" | "listening" | "thinking" | "speaking";

const STATUS: Record<MinaState, { label: string; sub: string; color: string }> = {
  idle:      { label: "STANDBY",   sub: "AWAITING COMMAND",    color: "rgba(0,212,255,0.6)" },
  listening: { label: "LISTENING", sub: "VOICE INPUT ACTIVE",  color: "rgba(0,255,150,0.8)" },
  thinking:  { label: "PROCESSING",sub: "NEURAL NET ACTIVE",   color: "rgba(0,150,255,0.9)" },
  speaking:  { label: "SPEAKING",  sub: "AUDIO OUTPUT ACTIVE", color: "rgba(0,212,255,0.9)" },
};

export default function MinaOrb({ state }: { state: MinaState }) {
  const s = STATUS[state];

  return (
    <div className="flex flex-col items-center gap-3 select-none">
      {/* Orb container */}
      <div className="relative flex items-center justify-center" style={{ width: 200, height: 200 }}>

        {/* Outermost slow-spin dashed ring */}
        <div
          className="absolute rounded-full animate-spin_slow2"
          style={{
            width: 196, height: 196,
            border: "1px dashed rgba(0,212,255,0.12)",
          }}
        />

        {/* Outer rotating ring */}
        <div
          className="absolute rounded-full animate-spin_slow"
          style={{
            width: 180, height: 180,
            border: "1px solid transparent",
            borderTopColor: "rgba(0,212,255,0.5)",
            borderRightColor: "rgba(0,212,255,0.15)",
          }}
        />

        {/* Reverse ring */}
        <div
          className="absolute rounded-full animate-spin_rev"
          style={{
            width: 160, height: 160,
            border: "1px solid transparent",
            borderTopColor: "rgba(0,150,255,0.6)",
            borderLeftColor: "rgba(0,150,255,0.2)",
          }}
        />

        {/* Mid ring */}
        <div
          className="absolute rounded-full animate-spin_slow"
          style={{
            width: 140, height: 140,
            border: "1px solid rgba(0,212,255,0.08)",
            animationDuration: "15s",
          }}
        />

        {/* Ripple rings when listening */}
        {state === "listening" && (
          <>
            <span
              className="absolute rounded-full animate-ripple"
              style={{ width: 120, height: 120, background: "rgba(0,255,150,0.15)" }}
            />
            <span
              className="absolute rounded-full animate-ripple"
              style={{ width: 120, height: 120, background: "rgba(0,255,150,0.1)", animationDelay: "0.7s" }}
            />
          </>
        )}

        {/* Core orb */}
        <div
          className={[
            "relative rounded-full flex items-center justify-center",
            state === "idle"     ? "animate-breathe" : "",
            state === "speaking" ? "animate-breathe" : "",
            state === "thinking" ? "animate-pulse"   : "",
          ].join(" ")}
          style={{
            width: 110,
            height: 110,
            background: `radial-gradient(circle at 35% 35%, rgba(0,220,255,0.9) 0%, rgba(0,100,200,0.7) 40%, rgba(0,20,60,0.95) 100%)`,
            boxShadow: `0 0 30px rgba(0,212,255,0.4), 0 0 60px rgba(0,100,200,0.3), 0 0 100px rgba(0,50,150,0.2), inset 0 0 30px rgba(0,180,255,0.2)`,
          }}
        >
          {/* Thinking spinner */}
          {state === "thinking" && (
            <div
              className="absolute inset-0 rounded-full animate-spin"
              style={{
                background: "conic-gradient(transparent 0deg, rgba(0,212,255,0.6) 180deg, transparent 360deg)",
              }}
            />
          )}

          {/* Inner glow dot */}
          <div
            className="rounded-full"
            style={{
              width: 20,
              height: 20,
              background: "rgba(200,240,255,0.9)",
              boxShadow: "0 0 20px rgba(255,255,255,0.8)",
            }}
          />
        </div>

        {/* Corner tick marks at 0°, 90°, 180°, 270° */}
        {[0, 90, 180, 270].map((deg) => (
          <div
            key={deg}
            className="absolute"
            style={{
              width: 8,
              height: 2,
              background: "rgba(0,212,255,0.6)",
              transform: `rotate(${deg}deg) translateX(95px)`,
              transformOrigin: "0 50%",
              top: "50%",
              left: "50%",
              marginLeft: -4,
              marginTop: -1,
            }}
          />
        ))}
      </div>

      {/* Status text */}
      <div className="text-center">
        <p
          className="text-xs font-bold tracking-[0.3em] animate-flicker"
          style={{ color: s.color, textShadow: `0 0 10px ${s.color}` }}
        >
          {s.label}
        </p>
        <p className="hud-label mt-0.5">{s.sub}</p>
      </div>
    </div>
  );
}

export function AnimatedBg() {
  return (
    <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden" style={{ perspective: "1200px" }}>
      <div className="absolute inset-0 bg-radial-glow" />
      <div className="absolute inset-0 grid-bg opacity-60" />

      {/* 3D rotating mesh layers */}
      <div
        className="absolute left-1/2 top-1/2 h-[60rem] w-[60rem] -translate-x-1/2 -translate-y-1/2 rounded-full opacity-40 anim-spin-slow"
        style={{
          transform: "translate(-50%, -50%) rotateX(65deg)",
          background:
            "conic-gradient(from 0deg, transparent 0%, oklch(0.78 0.18 175 / 0.35) 25%, transparent 50%, oklch(0.7 0.2 285 / 0.35) 75%, transparent 100%)",
          filter: "blur(60px)",
        }}
      />
      <div
        className="absolute left-1/2 top-1/2 h-[45rem] w-[45rem] -translate-x-1/2 -translate-y-1/2 rounded-full opacity-30 anim-spin-reverse"
        style={{
          transform: "translate(-50%, -50%) rotateX(70deg) rotateZ(45deg)",
          background:
            "conic-gradient(from 90deg, transparent 0%, oklch(0.7 0.2 285 / 0.4) 30%, transparent 60%, oklch(0.78 0.18 175 / 0.3) 90%, transparent 100%)",
          filter: "blur(80px)",
        }}
      />

      {/* Floating 3D orbs */}
      <div className="anim-blob anim-orb-3d absolute left-[-10%] top-[-10%] h-[40rem] w-[40rem] rounded-full bg-primary/25 blur-[120px]" />
      <div className="anim-blob anim-orb-3d absolute right-[-10%] top-[20%] h-[36rem] w-[36rem] rounded-full bg-accent/25 blur-[120px]" style={{ animationDelay: "-5s" }} />
      <div className="anim-blob anim-orb-3d absolute bottom-[-20%] left-[20%] h-[32rem] w-[32rem] rounded-full bg-primary/15 blur-[120px]" style={{ animationDelay: "-9s" }} />

      {/* Floating geometric shards (3D perspective) */}
      <div className="absolute inset-0" style={{ transformStyle: "preserve-3d" }}>
        {Array.from({ length: 8 }).map((_, i) => (
          <div
            key={i}
            className="anim-shard absolute h-24 w-24 rounded-2xl border border-primary/30 bg-gradient-to-br from-primary/10 to-accent/10 backdrop-blur-sm"
            style={{
              left: `${(i * 13 + 7) % 95}%`,
              top: `${(i * 17 + 11) % 90}%`,
              animationDelay: `${-i * 2.3}s`,
              transform: `rotateX(${i * 30}deg) rotateY(${i * 45}deg)`,
            }}
          />
        ))}
      </div>
    </div>
  );
}

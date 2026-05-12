export function AnimatedBg() {
  return (
    <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
      <div className="absolute inset-0 bg-radial-glow" />
      <div className="absolute inset-0 grid-bg opacity-60" />
      <div className="anim-blob absolute left-[-10%] top-[-10%] h-[40rem] w-[40rem] rounded-full bg-primary/20 blur-[120px]" />
      <div className="anim-blob absolute right-[-10%] top-[20%] h-[36rem] w-[36rem] rounded-full bg-accent/20 blur-[120px]" style={{ animationDelay: "-5s" }} />
      <div className="anim-blob absolute bottom-[-20%] left-[20%] h-[32rem] w-[32rem] rounded-full bg-primary/10 blur-[120px]" style={{ animationDelay: "-9s" }} />
    </div>
  );
}

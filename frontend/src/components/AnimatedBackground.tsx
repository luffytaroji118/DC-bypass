export function AnimatedBackground() {
  return (
    <div aria-hidden="true" className="fixed inset-0 -z-10 overflow-hidden bg-background">
      <div className="fog fog-1" />
      <div className="fog fog-2" />
      <div className="fog fog-3" />
      <div className="fog fog-4" />
      <div className="fog-vignette" />
    </div>
  );
}

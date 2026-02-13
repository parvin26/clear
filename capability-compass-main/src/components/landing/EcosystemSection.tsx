const EcosystemSection = () => {
  return (
    <section id="ecosystem" className="py-20">
      <div className="container mx-auto max-w-7xl px-6">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Content */}
          <div className="space-y-6">
            <h2 className="text-2xl md:text-3xl font-semibold text-foreground">
              Part of the Be Noor Ecosystem
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              CLEAR is the capability layer within Be Noor. It connects enterprise reality to ethical capital, research insight, and long-term resilience.
            </p>
          </div>

          {/* Diagram */}
          <div className="relative">
            <EcosystemDiagram />
          </div>
        </div>
      </div>
    </section>
  );
};

const EcosystemDiagram = () => {
  return (
    <div className="relative max-w-sm mx-auto">
      <svg viewBox="0 0 300 200" className="w-full h-auto">
        {/* Connection lines */}
        <line x1="60" y1="100" x2="150" y2="100" stroke="hsl(var(--border))" strokeWidth="2" />
        <line x1="150" y1="100" x2="240" y2="100" stroke="hsl(var(--border))" strokeWidth="2" />

        {/* Capital node */}
        <circle cx="60" cy="100" r="35" fill="hsl(var(--background))" stroke="hsl(var(--border))" strokeWidth="2" />
        <text x="60" y="105" textAnchor="middle" className="text-xs font-medium fill-foreground">
          Capital
        </text>

        {/* Capability node (CLEAR - highlighted) */}
        <circle cx="150" cy="100" r="45" fill="hsl(var(--primary))" />
        <circle cx="150" cy="100" r="52" fill="none" stroke="hsl(var(--primary))" strokeWidth="2" opacity="0.3" />
        <text x="150" y="95" textAnchor="middle" className="text-xs font-medium fill-primary-foreground">
          Capability
        </text>
        <text x="150" y="110" textAnchor="middle" className="text-[10px] fill-primary-foreground opacity-80">
          CLEAR
        </text>

        {/* Ecosystem Insight node */}
        <circle cx="240" cy="100" r="35" fill="hsl(var(--background))" stroke="hsl(var(--border))" strokeWidth="2" />
        <text x="240" y="95" textAnchor="middle" className="text-[10px] font-medium fill-foreground">
          Ecosystem
        </text>
        <text x="240" y="108" textAnchor="middle" className="text-[10px] font-medium fill-foreground">
          Insight
        </text>

        {/* Be Noor label */}
        <text x="150" y="180" textAnchor="middle" className="text-sm font-semibold fill-muted-foreground">
          Be Noor Ecosystem
        </text>
      </svg>
    </div>
  );
};

export default EcosystemSection;

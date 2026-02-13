"use client";

export function StakeholderDiagram() {
  return (
    <div className="w-full h-full bg-white rounded-xl shadow-[0_4px_20px_rgba(0,0,0,0.06)] border border-[#1F2A37]/5 p-8 flex items-center justify-center aspect-[4/3] md:aspect-auto">
      <svg viewBox="0 0 600 450" className="w-full h-full max-w-[500px]" style={{ overflow: "visible" }}>
        {/* Triangle Connections (Outer) */}
        <line x1="290" y1="80" x2="90" y2="380" stroke="#1F2A37" strokeOpacity="0.2" strokeWidth="1.5" />
        <line x1="290" y1="80" x2="490" y2="380" stroke="#1F2A37" strokeOpacity="0.2" strokeWidth="1.5" />
        <line x1="90" y1="380" x2="490" y2="380" stroke="#1F2A37" strokeOpacity="0.2" strokeWidth="1.5" />

        {/* Center Connections */}
        <g>
          <line x1="290" y1="250" x2="290" y2="110" stroke="#1D4ED8" strokeOpacity="0.3" strokeWidth="1.5" />
          <line x1="290" y1="250" x2="120" y2="370" stroke="#1D4ED8" strokeOpacity="0.3" strokeWidth="1.5" />
          <line x1="290" y1="250" x2="460" y2="370" stroke="#1D4ED8" strokeOpacity="0.3" strokeWidth="1.5" />
        </g>

        {/* Tension Labels */}
        <g transform="translate(190, 230)">
          <rect x="-55" y="-10" width="110" height="20" fill="white" fillOpacity="0.9" />
          <text x="0" y="5" textAnchor="middle" fill="rgba(31,42,55,0.55)" fontSize="13" fontWeight="400" fontFamily="sans-serif">
            unclear mandates
          </text>
        </g>
        <g transform="translate(390, 230)">
          <rect x="-55" y="-10" width="110" height="20" fill="white" fillOpacity="0.9" />
          <text x="0" y="5" textAnchor="middle" fill="rgba(31,42,55,0.55)" fontSize="13" fontWeight="400" fontFamily="sans-serif">
            governance gap
          </text>
        </g>
        <g transform="translate(290, 380)">
          <rect x="-55" y="-10" width="110" height="20" fill="white" fillOpacity="0.9" />
          <text x="0" y="5" textAnchor="middle" fill="rgba(31,42,55,0.55)" fontSize="13" fontWeight="400" fontFamily="sans-serif">
            opaque readiness
          </text>
        </g>

        {/* Stakeholder Nodes */}
        <g transform="translate(290, 70)">
          <text x="0" y="0" textAnchor="middle" fill="#1F2A37" fontSize="14" fontWeight="600" fontFamily="sans-serif">
            Founder
          </text>
        </g>
        <g transform="translate(90, 380)">
          <text x="0" y="15" textAnchor="middle" fill="#1F2A37" fontSize="14" fontWeight="600" fontFamily="sans-serif">
            Leadership<tspan x="0" dy="16">Team</tspan>
          </text>
        </g>
        <g transform="translate(490, 380)">
          <text x="0" y="15" textAnchor="middle" fill="#1F2A37" fontSize="14" fontWeight="600" fontFamily="sans-serif">
            Capital<tspan x="0" dy="16">Partner</tspan>
          </text>
        </g>

        {/* Center Node */}
        <g transform="translate(290, 250)">
          <circle r="38" fill="rgba(29,78,216,0.06)" stroke="#1D4ED8" strokeWidth="1.5" />
          <text x="0" y="5" textAnchor="middle" fill="#1D4ED8" fontSize="16" fontWeight="bold" fontFamily="sans-serif">
            CLEAR
          </text>
        </g>
      </svg>
    </div>
  );
}

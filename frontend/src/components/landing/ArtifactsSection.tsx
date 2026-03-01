"use client";

const ARTIFACTS = [
  {
    id: "01",
    title: "Decision Record",
    description:
      "What you decided, why, what alternatives were considered and what success looks like.",
  },
  {
    id: "02",
    title: "Operating Rhythm",
    description:
      "Structured check-ins and review triggers so execution doesn't drift between sessions.",
  },
  {
    id: "03",
    title: "Execution Board",
    description:
      "Owners, milestones, deadlines and evidence. All linked back to the original decision.",
  },
  {
    id: "04",
    title: "Decision History",
    description:
      "What happened, what was learned and what you'd do differently. Growing with every cycle.",
  },
];

export function ArtifactsSection() {
  return (
    <section className="bg-white w-full py-20 lg:pt-24 lg:pb-20">
      <div className="max-w-[1120px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col items-center gap-3 text-center mb-12">
          <h2 className="text-[32px] font-bold text-[#1F2A37] leading-tight">
            Four outputs you can share, review and reuse.
          </h2>
          <p className="text-base font-normal text-[#1F2A37]/65 max-w-2xl">
            Every diagnostic produces structured, written outputs. Not chat responses.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-5">
          {ARTIFACTS.map((card) => (
            <div
              key={card.id}
              className="bg-[#F9FAFB] border border-[#1F2A37]/[0.08] rounded-xl p-6 flex flex-col h-full transition-all duration-200 hover:shadow-[0_2px_12px_rgba(0,0,0,0.05)] hover:border-[#1F2A37]/14 group overflow-hidden"
            >
              <div className="text-[48px] font-bold text-[#1F2A37]/[0.06] leading-none -mt-2 mb-1 group-hover:text-[#1F2A37]/[0.1] transition-colors">
                {card.id}
              </div>
              <h3 className="text-base font-semibold text-[#1F2A37] mb-2">
                {card.title}
              </h3>
              <p className="text-[13px] font-normal text-[#1F2A37]/65 leading-relaxed">
                {card.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

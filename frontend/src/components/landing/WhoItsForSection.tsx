"use client";

const GROUPS = [
  {
    id: "01",
    title: "Owner managed SMEs (5 to 100 people)",
    desc: "Founders who want more discipline around cash, operations and execution, not just more dashboards.",
  },
  {
    id: "02",
    title: "Seed to Series A founders",
    desc: 'Teams moving from "founder in the middle of everything" to a repeatable way of deciding, planning and reviewing.',
  },
  {
    id: "03",
    title: "Funds, DFIs, banks and programs that support SMEs",
    desc: "Capital and ecosystem partners who need clearer governance signals and readiness across many businesses.",
  },
];

export function WhoItsForSection() {
  return (
    <section className="bg-[#1F2A37] py-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h2 className="text-3xl font-bold text-white text-center mb-16">
          Who we help
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {GROUPS.map((group) => (
            <div
              key={group.id}
              className="bg-[#2D3748] p-8 rounded-xl border border-gray-700 hover:border-gray-600 transition-colors relative overflow-hidden group"
            >
              <span className="text-4xl font-bold text-white/[0.08] block mb-4 select-none group-hover:text-white/[0.12] transition-colors">
                {group.id}
              </span>
              <h3 className="text-lg font-bold text-white mb-3 leading-tight">
                {group.title}
              </h3>
              <p className="text-sm text-gray-400 leading-relaxed">
                {group.desc}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

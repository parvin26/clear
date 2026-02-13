"use client";

const ITEMS = [
  {
    title: "Audit trail",
    desc: "Every edit and decision is time-stamped.",
  },
  {
    title: "Decision records",
    desc: "Immutable history of what was decided.",
  },
  {
    title: "Controlled sharing",
    desc: "Granular permissions for every artifact.",
  },
  {
    title: "Data sovereignty",
    desc: "Your strategic data stays yours.",
  },
];

export function TrustSection() {
  return (
    <section className="bg-[#F9FAFB] py-20 border-t border-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8 text-left">
          <h2 className="text-xl font-bold text-[#1F2A37]">
            How we protect your decisions
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {ITEMS.map((item, i) => (
            <div
              key={i}
              className="flex flex-col gap-2 p-6 bg-white border border-gray-100 rounded-lg shadow-sm border-l-4 border-l-[#1D4ED8] hover:shadow-md transition-shadow"
            >
              <h3 className="font-bold text-[#1F2A37] text-sm">{item.title}</h3>
              <p className="text-xs text-gray-500 leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

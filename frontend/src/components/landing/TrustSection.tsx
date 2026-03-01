"use client";

const ITEMS = [
  {
    title: "Finalisation & Sign-off",
    desc: "Decisions can be locked and signed off by the relevant stakeholders.",
  },
  {
    title: "Full Audit Trail",
    desc: "Every change, input and review is recorded. Nothing gets rewritten after the fact.",
  },
  {
    title: "Evidence-Linked Milestones",
    desc: "Progress claims are attached to real activity, not self-reported status updates.",
  },
  {
    title: "Controlled Sharing",
    desc: "You choose what partners and investors can see. Access is revocable at any time.",
  },
];

export function TrustSection() {
  return (
    <section className="bg-[#F9FAFB] py-20 border-t border-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8 text-left">
          <h2 className="text-xl font-bold text-[#1F2A37]">
            Built for auditability and controlled sharing.
          </h2>
          <p className="text-[#1F2A37]/65 text-sm mt-2 max-w-2xl">
            CLEAR treats every decision as a governed record. Not a note in a chat thread.
          </p>
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

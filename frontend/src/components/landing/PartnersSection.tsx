"use client";

const PARTNERS = [
  "Tally",
  "Be Wise",
  "Lighthouse Ledger",
  "Be Noor Foundation",
  "Capital Partners",
  "Growth Ops",
];

export function PartnersSection() {
  return (
    <section className="w-full py-20 px-6 md:px-12 lg:px-24 bg-[#FAFAFA] text-center">
      <div className="max-w-[1120px] mx-auto">
        <h2 className="text-2xl md:text-3xl font-bold text-[#1F2A37] mb-3">
          Part of the Be Noor ecosystem
        </h2>
        <p className="text-lg text-[#1F2A37]/65 mb-12">
          Built and supported by operators, products, and capital focused on
          MSMEs.
        </p>

        <div
          className="flex flex-wrap justify-center items-center gap-x-12 gap-y-6"
          style={{ gap: "40px 48px" }}
        >
          {PARTNERS.map((name) => (
            <span
              key={name}
              className="text-[15px] font-medium whitespace-nowrap transition-colors hover:opacity-80"
              style={{ color: "rgba(31, 42, 55, 0.45)" }}
            >
              {name}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}

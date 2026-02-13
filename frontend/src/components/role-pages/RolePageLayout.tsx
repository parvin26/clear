"use client";

interface RolePageLayoutProps {
  title: string;
  subtitle: string;
  children: React.ReactNode;
}

export function RolePageLayout({ title, subtitle, children }: RolePageLayoutProps) {
  return (
    <div className="font-sans antialiased text-[#1F2A37] bg-white min-h-screen flex flex-col">
      <main className="flex-grow pt-6 pb-20">
        <div className="max-w-[1120px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-20 max-w-3xl">
            <h1 className="text-[48px] font-bold text-[#1F2A37] tracking-tight leading-[1.1] mb-6">
              {title}
            </h1>
            <p className="text-[17px] text-[#1F2A37]/65 font-normal leading-relaxed">
              {subtitle}
            </p>
          </div>

          {children}
        </div>
      </main>
    </div>
  );
}

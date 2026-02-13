import type { Metadata } from "next";
import Link from "next/link";
import { DemoDisclaimerBanner } from "@/components/demo/DemoDisclaimerBanner";
import { DemoCTABar } from "@/components/demo/DemoCTABar";

export const metadata: Metadata = {
  title: "CLEAR demo – Sample workspace",
  description: "Demonstration workspace using fictional data. Read-only.",
  robots: { index: false, follow: false },
};

export default function DemoLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <DemoDisclaimerBanner />
      <div className="pb-24">{children}</div>
      <DemoCTABar />
    </>
  );
}

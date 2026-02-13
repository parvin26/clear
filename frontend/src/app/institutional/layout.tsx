import { InstitutionalGate } from "./InstitutionalGate";

export default function InstitutionalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <InstitutionalGate>{children}</InstitutionalGate>;
}

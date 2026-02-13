"use client";

import Link from "next/link";
import { Shell } from "@/components/layout/Shell";
import { LegalLayout } from "@/components/legal/LegalLayout";

export default function PrivacyPage() {
  return (
    <Shell>
      <LegalLayout title="Privacy Policy" lastUpdated="February 2025">
        <div className="space-y-12">
          <section>
            <h3 className="text-[20px] font-bold text-[#1F2A37] mb-4">1. Who we are</h3>
            <p className="text-[16px] text-[#1F2A37]/70 leading-relaxed">
              CLEAR Commons (&quot;we&quot;, &quot;our&quot;) provides execution governance and
              diagnostic tools for enterprises and capital partners. This policy describes how we
              collect, use, and protect your information when you use our website and services.
            </p>
          </section>

          <section>
            <h3 className="text-[20px] font-bold text-[#1F2A37] mb-4">2. Information we collect</h3>
            <p className="text-[16px] text-[#1F2A37]/70 leading-relaxed">
              We collect information you provide directly (e.g. account registration, diagnostic
              inputs, contact and inquiry forms) and usage data necessary to operate and improve our
              services. We do not sell your personal information.
            </p>
          </section>

          <section>
            <h3 className="text-[20px] font-bold text-[#1F2A37] mb-4">3. How we use it</h3>
            <p className="text-[16px] text-[#1F2A37]/70 leading-relaxed">
              We use your information to deliver and improve our services, communicate with you,
              and comply with legal obligations. Decision and execution data you create is used to
              power your workspace and, where you choose, shared visibility for partners.
            </p>
          </section>

          <section>
            <h3 className="text-[20px] font-bold text-[#1F2A37] mb-4">
              4. Data retention and security
            </h3>
            <p className="text-[16px] text-[#1F2A37]/70 leading-relaxed">
              We retain your data as long as your account is active or as needed to provide
              services. We apply industry-standard measures to protect your data. For security
              practices, see our{" "}
              <Link href="/security" className="text-[#1D4ED8] hover:underline">
                Security
              </Link>{" "}
              page.
            </p>
          </section>

          <section>
            <h3 className="text-[20px] font-bold text-[#1F2A37] mb-4">5. Your rights</h3>
            <p className="text-[16px] text-[#1F2A37]/70 leading-relaxed">
              Depending on your jurisdiction, you may have rights to access, correct, delete, or port
              your data, and to object to or restrict certain processing. Contact us at the details
              on our{" "}
              <Link href="/contact" className="text-[#1D4ED8] hover:underline">
                Contact
              </Link>{" "}
              page to exercise these rights.
            </p>
          </section>

          <section>
            <h3 className="text-[20px] font-bold text-[#1F2A37] mb-4">6. Contact</h3>
            <p className="text-[16px] text-[#1F2A37]/70 leading-relaxed">
              For privacy-related questions or requests, use our{" "}
              <Link href="/contact" className="text-[#1D4ED8] hover:underline">
                Contact
              </Link>{" "}
              form or the address provided there.
            </p>
          </section>
        </div>
      </LegalLayout>
    </Shell>
  );
}

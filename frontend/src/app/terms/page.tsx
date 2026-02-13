"use client";

import Link from "next/link";
import { Shell } from "@/components/layout/Shell";
import { LegalLayout } from "@/components/legal/LegalLayout";

export default function TermsPage() {
  return (
    <Shell>
      <LegalLayout title="Terms of Service" lastUpdated="February 2025">
        <div className="space-y-12">
          <section>
            <h3 className="text-[20px] font-bold text-[#1F2A37] mb-4">1. Acceptance</h3>
            <p className="text-[16px] text-[#1F2A37]/70 leading-relaxed">
              By using CLEAR Commons (&quot;CLEAR&quot;) websites and services, you agree to these
              Terms of Service. If you do not agree, do not use our services.
            </p>
          </section>

          <section>
            <h3 className="text-[20px] font-bold text-[#1F2A37] mb-4">2. Description of service</h3>
            <p className="text-[16px] text-[#1F2A37]/70 leading-relaxed">
              CLEAR provides execution governance, diagnostics, and decision workspace tools for
              enterprises and capital partners. You are responsible for the accuracy of information
              you provide and for how you use the platform.
            </p>
          </section>

          <section>
            <h3 className="text-[20px] font-bold text-[#1F2A37] mb-4">3. Acceptable use</h3>
            <p className="text-[16px] text-[#1F2A37]/70 leading-relaxed">
              You agree not to misuse the service, circumvent security or access controls, or use the
              platform for illegal or harmful purposes. We may suspend or terminate access for
              violation of these terms.
            </p>
          </section>

          <section>
            <h3 className="text-[20px] font-bold text-[#1F2A37] mb-4">4. Intellectual property</h3>
            <p className="text-[16px] text-[#1F2A37]/70 leading-relaxed">
              CLEAR and its licensors own the platform and materials. You retain ownership of your
              data. You grant us limited rights to host, process, and display your data to provide
              the service and, where you opt in, to share with designated partners.
            </p>
          </section>

          <section>
            <h3 className="text-[20px] font-bold text-[#1F2A37] mb-4">5. Limitation of liability</h3>
            <p className="text-[16px] text-[#1F2A37]/70 leading-relaxed">
              The service is provided &quot;as is&quot;. To the extent permitted by law, we are not
              liable for indirect, incidental, or consequential damages. Our total liability is
              limited to the amount you paid us in the twelve months before the claim.
            </p>
          </section>

          <section>
            <h3 className="text-[20px] font-bold text-[#1F2A37] mb-4">6. Changes</h3>
            <p className="text-[16px] text-[#1F2A37]/70 leading-relaxed">
              We may update these terms from time to time. We will post the updated terms and, where
              required, notify you. Continued use after changes constitutes acceptance.
            </p>
          </section>

          <section>
            <h3 className="text-[20px] font-bold text-[#1F2A37] mb-4">7. Contact</h3>
            <p className="text-[16px] text-[#1F2A37]/70 leading-relaxed">
              For questions about these terms, use our{" "}
              <Link href="/contact" className="text-[#1D4ED8] hover:underline">
                Contact
              </Link>{" "}
              page.
            </p>
          </section>
        </div>
      </LegalLayout>
    </Shell>
  );
}

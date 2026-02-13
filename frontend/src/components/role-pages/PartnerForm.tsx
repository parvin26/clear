"use client";

import React, { useState } from "react";
import Link from "next/link";
import { postPartnerInquiry } from "@/lib/api";

const ORG_TYPES = [
  { value: "vc", label: "Venture Capital" },
  { value: "pe", label: "Private Equity" },
  { value: "fo", label: "Family Office" },
];

const PORTFOLIO_SIZES = [
  { value: "small", label: "1-10 companies" },
  { value: "medium", label: "11-50 companies" },
  { value: "large", label: "50+ companies" },
];

export function PartnerForm() {
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    orgName: "",
    orgType: "",
    size: "",
    email: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await postPartnerInquiry({
        organization_name: formData.orgName.trim(),
        organization_type: formData.orgType || undefined,
        portfolio_size: formData.size || undefined,
        contact_email: formData.email.trim(),
      });
      setSubmitted(true);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Submission failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <div className="bg-[#F8F9FB] border border-[#1F2A37]/10 rounded-xl p-10 mb-32 max-w-2xl mx-auto text-center">
        <h2 className="text-[20px] font-bold text-[#1F2A37] mb-2">Request received</h2>
        <p className="text-[14px] text-[#1F2A37]/65 mb-6">
          We will respond within 24–48 hours to discuss partner onboarding and access.
        </p>
        <Link
          href="/for-partners"
          className="inline-block h-12 px-6 bg-[#1F2A37] text-white text-[15px] font-bold rounded-lg hover:bg-[#111827] transition-colors leading-[48px]"
        >
          Back to For Partners
        </Link>
      </div>
    );
  }

  return (
    <div className="bg-[#F8F9FB] border border-[#1F2A37]/10 rounded-xl p-10 mb-32 max-w-2xl mx-auto">
      <div className="text-center mb-8">
        <h2 className="text-[20px] font-bold text-[#1F2A37] mb-2">Partner Access Request</h2>
        <p className="text-[14px] text-[#1F2A37]/65">
          Join the CLEAR ecosystem to view portfolio readiness signals.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label className="block text-[12px] font-bold text-[#1F2A37] uppercase tracking-wider mb-2">
            Organization
          </label>
          <input
            value={formData.orgName}
            onChange={(e) => setFormData({ ...formData, orgName: e.target.value })}
            required
            className="w-full h-12 px-4 bg-white border border-[#1F2A37]/15 rounded-lg text-[15px] focus:border-[#1D4ED8] focus:ring-1 focus:ring-[#1D4ED8] outline-none transition-colors"
            placeholder="e.g. Acme Ventures"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div>
            <label className="block text-[12px] font-bold text-[#1F2A37] uppercase tracking-wider mb-2">
              Type
            </label>
            <select
              value={formData.orgType}
              onChange={(e) => setFormData({ ...formData, orgType: e.target.value })}
              className="w-full h-12 px-4 bg-white border border-[#1F2A37]/15 rounded-lg text-[15px] outline-none focus:border-[#1D4ED8] appearance-none"
            >
              <option value="">Select type...</option>
              {ORG_TYPES.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-[12px] font-bold text-[#1F2A37] uppercase tracking-wider mb-2">
              Portfolio Size
            </label>
            <select
              value={formData.size}
              onChange={(e) => setFormData({ ...formData, size: e.target.value })}
              className="w-full h-12 px-4 bg-white border border-[#1F2A37]/15 rounded-lg text-[15px] outline-none focus:border-[#1D4ED8] appearance-none"
            >
              <option value="">Select range...</option>
              {PORTFOLIO_SIZES.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label className="block text-[12px] font-bold text-[#1F2A37] uppercase tracking-wider mb-2">
            Work Email
          </label>
          <input
            type="email"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            required
            className="w-full h-12 px-4 bg-white border border-[#1F2A37]/15 rounded-lg text-[15px] focus:border-[#1D4ED8] focus:ring-1 focus:ring-[#1D4ED8] outline-none transition-colors"
            placeholder="you@fund.com"
          />
        </div>

        {error && <p className="text-[14px] text-red-600">{error}</p>}

        <button
          type="submit"
          disabled={loading}
          className="w-full h-12 bg-[#1F2A37] text-white font-bold text-[15px] rounded-lg hover:bg-[#111827] transition-colors shadow-sm mt-4 disabled:opacity-60"
        >
          {loading ? "Submitting…" : "Request Access"}
        </button>
      </form>
    </div>
  );
}

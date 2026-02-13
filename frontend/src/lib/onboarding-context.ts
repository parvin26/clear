/** Optional onboarding context (name, country, industry, etc.) stored in localStorage; attached to diagnostic run. */

export const ONBOARDING_CONTEXT_KEY = "clear_onboarding_context";

export interface OnboardingContext {
  name?: string;
  email?: string;
  phone?: string;
  company_name?: string;
  industry?: string;
  country?: string;
  company_size_band?: string; // e.g. "1-5", "6-10"
  stage?: string; // survival | stability | success | scale
  challenge?: string; // finance | marketing | operations | etc.
}

export function getOnboardingContext(): OnboardingContext | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(ONBOARDING_CONTEXT_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as OnboardingContext;
  } catch {
    return null;
  }
}

export function setOnboardingContext(ctx: OnboardingContext | null): void {
  if (typeof window === "undefined") return;
  try {
    if (ctx == null) {
      localStorage.removeItem(ONBOARDING_CONTEXT_KEY);
    } else {
      localStorage.setItem(ONBOARDING_CONTEXT_KEY, JSON.stringify(ctx));
    }
  } catch (_) {}
}

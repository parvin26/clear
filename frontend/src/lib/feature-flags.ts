/**
 * Feature flags for intake and redirects. Toggle via env without code changes.
 */

export const USE_NEW_DIAGNOSTIC_REDIRECTS =
  process.env.NEXT_PUBLIC_USE_NEW_DIAGNOSTIC_REDIRECTS === "true";

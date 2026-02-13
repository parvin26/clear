/** When true, diagnostic submit uses POST /api/clear/diagnostic/run (multi-agent synthesis). When false, uses single-agent route + bootstrap. */
export const USE_BACKEND_DIAGNOSTIC_RUN =
  process.env.NEXT_PUBLIC_USE_BACKEND_DIAGNOSTIC_RUN !== "false";

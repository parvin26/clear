/**
 * Relative date labels for demo display only. Keeps the demo feeling current.
 * Uses today as reference; does not change fixture data.
 */

function parseDate(iso: string | null | undefined): Date | null {
  if (!iso || typeof iso !== "string") return null;
  const d = new Date(iso);
  return isNaN(d.getTime()) ? null : d;
}

function startOfToday(): Date {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

/**
 * Returns a short label for a due date, e.g. "Due in 12 days", "Overdue by 5 days", "Due today".
 */
export function formatDueRelative(iso: string | null | undefined): string {
  const date = parseDate(iso);
  if (!date) return "";
  const today = startOfToday();
  const diffMs = date.getTime() - today.getTime();
  const diffDays = Math.round(diffMs / (24 * 60 * 60 * 1000));

  if (diffDays < 0) return `Overdue by ${Math.abs(diffDays)} day${Math.abs(diffDays) === 1 ? "" : "s"}`;
  if (diffDays === 0) return "Due today";
  if (diffDays === 1) return "Due tomorrow";
  if (diffDays <= 14) return `Due in ${diffDays} days`;
  if (diffDays <= 60) return `Due in ${Math.round(diffDays / 7)} weeks`;
  return `Due in ${Math.round(diffDays / 30)} months`;
}

/**
 * Returns a short label for a review date, e.g. "Review due in 3 weeks", "Review overdue by 2 days".
 */
export function formatReviewRelative(iso: string | null | undefined): string {
  const date = parseDate(iso);
  if (!date) return "";
  const today = startOfToday();
  const diffMs = date.getTime() - today.getTime();
  const diffDays = Math.round(diffMs / (24 * 60 * 60 * 1000));

  if (diffDays < 0) return `Review overdue by ${Math.abs(diffDays)} day${Math.abs(diffDays) === 1 ? "" : "s"}`;
  if (diffDays === 0) return "Review due today";
  if (diffDays === 1) return "Review due tomorrow";
  if (diffDays <= 14) return `Review due in ${diffDays} days`;
  if (diffDays <= 60) return `Review due in ${Math.round(diffDays / 7)} weeks`;
  return `Review due in ${Math.round(diffDays / 30)} months`;
}

/**
 * Optional: for "Review: YYYY-MM-DD" display, keep a short past reference.
 */
export function formatPastReviewRelative(iso: string | null | undefined): string {
  const date = parseDate(iso);
  if (!date) return "";
  const today = startOfToday();
  const diffMs = today.getTime() - date.getTime();
  const diffDays = Math.round(diffMs / (24 * 60 * 60 * 1000));

  if (diffDays <= 0) return "Review today";
  if (diffDays === 1) return "Reviewed yesterday";
  if (diffDays <= 14) return `Reviewed ${diffDays} days ago`;
  if (diffDays <= 60) return `Reviewed ${Math.round(diffDays / 7)} weeks ago`;
  return `Reviewed ${Math.round(diffDays / 30)} months ago`;
}

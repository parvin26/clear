"use client";

const STROKE_WIDTH = 1.25;
const COLOR_BLUE = "#1D4ED8";
const COLOR_NAVY = "#1F2A37";
const COLOR_GREY = "#CBD5E1";

export function DiagramDecisionRecord() {
  return (
    <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
      <rect x="8" y="6" width="32" height="36" rx="2" stroke={COLOR_GREY} strokeWidth={STROKE_WIDTH} fill="white" />
      <line x1="14" y1="14" x2="34" y2="14" stroke={COLOR_NAVY} strokeWidth={STROKE_WIDTH} />
      <line x1="14" y1="20" x2="28" y2="20" stroke={COLOR_NAVY} strokeWidth={STROKE_WIDTH} opacity="0.5" />
      <path d="M14 28H24" stroke={COLOR_BLUE} strokeWidth={STROKE_WIDTH} />
      <path d="M14 34H34" stroke={COLOR_GREY} strokeWidth={STROKE_WIDTH} />
    </svg>
  );
}

export function DiagramExecution() {
  return (
    <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
      <line x1="8" y1="24" x2="40" y2="24" stroke={COLOR_GREY} strokeWidth={STROKE_WIDTH} />
      <circle cx="12" cy="24" r="3" fill="white" stroke={COLOR_BLUE} strokeWidth={STROKE_WIDTH} />
      <circle cx="24" cy="24" r="3" fill="white" stroke={COLOR_BLUE} strokeWidth={STROKE_WIDTH} />
      <circle cx="36" cy="24" r="3" fill={COLOR_BLUE} />
    </svg>
  );
}

export function DiagramOutcomes() {
  return (
    <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
      <path d="M8 36L16 28L24 32L40 12" stroke={COLOR_BLUE} strokeWidth={STROKE_WIDTH} strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="8" cy="36" r="2" fill={COLOR_BLUE} />
      <circle cx="16" cy="28" r="2" fill="white" stroke={COLOR_BLUE} strokeWidth={STROKE_WIDTH} />
      <circle cx="24" cy="32" r="2" fill="white" stroke={COLOR_BLUE} strokeWidth={STROKE_WIDTH} />
      <circle cx="40" cy="12" r="2" fill={COLOR_BLUE} />
    </svg>
  );
}

export function DiagramMemory() {
  return (
    <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
      <rect x="10" y="10" width="12" height="12" rx="2" stroke={COLOR_GREY} strokeWidth={STROKE_WIDTH} />
      <rect x="26" y="10" width="12" height="12" rx="2" stroke={COLOR_GREY} strokeWidth={STROKE_WIDTH} />
      <rect x="10" y="26" width="12" height="12" rx="2" stroke={COLOR_GREY} strokeWidth={STROKE_WIDTH} />
      <rect x="26" y="26" width="12" height="12" rx="2" stroke={COLOR_BLUE} strokeWidth={STROKE_WIDTH} fill={COLOR_BLUE} fillOpacity="0.05" />
    </svg>
  );
}

export function DiagramSharing() {
  return (
    <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
      <circle cx="24" cy="24" r="14" stroke={COLOR_GREY} strokeWidth={STROKE_WIDTH} strokeDasharray="4 4" />
      <circle cx="24" cy="24" r="6" stroke={COLOR_BLUE} strokeWidth={STROKE_WIDTH} />
      <path d="M24 18V10" stroke={COLOR_BLUE} strokeWidth={STROKE_WIDTH} />
      <path d="M24 30V38" stroke={COLOR_BLUE} strokeWidth={STROKE_WIDTH} />
      <path d="M30 24H38" stroke={COLOR_BLUE} strokeWidth={STROKE_WIDTH} />
      <path d="M18 24H10" stroke={COLOR_BLUE} strokeWidth={STROKE_WIDTH} />
    </svg>
  );
}

export function DiagramChaos() {
  return (
    <svg width="64" height="64" viewBox="0 0 64 64" fill="none">
      <circle cx="12" cy="18" r="2" fill={COLOR_NAVY} opacity="0.3" />
      <circle cx="45" cy="14" r="2" fill={COLOR_NAVY} opacity="0.3" />
      <circle cx="32" cy="48" r="2" fill={COLOR_NAVY} opacity="0.3" />
      <circle cx="52" cy="36" r="2" fill={COLOR_NAVY} opacity="0.3" />
      <circle cx="18" cy="52" r="2" fill={COLOR_NAVY} opacity="0.3" />
      <line x1="12" y1="18" x2="32" y2="48" stroke={COLOR_GREY} strokeWidth={1} />
      <line x1="45" y1="14" x2="32" y2="48" stroke={COLOR_GREY} strokeWidth={1} />
      <line x1="52" y1="36" x2="32" y2="48" stroke={COLOR_GREY} strokeWidth={1} />
    </svg>
  );
}

export function DiagramOrder() {
  return (
    <svg width="64" height="64" viewBox="0 0 64 64" fill="none">
      <line x1="8" y1="32" x2="56" y2="32" stroke={COLOR_GREY} strokeWidth={1.5} />
      <circle cx="16" cy="32" r="3" fill="white" stroke={COLOR_BLUE} strokeWidth={1.5} />
      <circle cx="32" cy="32" r="3" fill="white" stroke={COLOR_BLUE} strokeWidth={1.5} />
      <circle cx="48" cy="32" r="3" fill={COLOR_BLUE} />
    </svg>
  );
}

export function DiagramPrioritization() {
  return (
    <svg width="64" height="64" viewBox="0 0 64 64" fill="none">
      <rect x="16" y="16" width="32" height="6" rx="1" fill={COLOR_BLUE} />
      <rect x="16" y="26" width="24" height="6" rx="1" fill={COLOR_GREY} />
      <rect x="16" y="36" width="18" height="6" rx="1" fill={COLOR_GREY} opacity="0.6" />
      <rect x="16" y="46" width="12" height="6" rx="1" fill={COLOR_GREY} opacity="0.3" />
    </svg>
  );
}

export function DiagramVisibility() {
  return (
    <svg width="64" height="64" viewBox="0 0 64 64" fill="none">
      <rect x="10" y="12" width="44" height="32" rx="2" stroke={COLOR_NAVY} strokeWidth={1.25} />
      <path d="M14 32 L22 32 L26 24 L30 36 L34 32 L50 32" stroke={COLOR_BLUE} strokeWidth={1.25} strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="26" cy="24" r="1.5" fill={COLOR_BLUE} />
      <circle cx="30" cy="36" r="1.5" fill={COLOR_BLUE} />
    </svg>
  );
}

/** Document icon for legal pages (document with folded corner, lines). */
export function DiagramDocument() {
  return (
    <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
      <path
        d="M10 8h22l8 8v28H10V8z"
        stroke={COLOR_GREY}
        strokeWidth={STROKE_WIDTH}
        fill="white"
      />
      <path d="M32 8v8h8" stroke={COLOR_GREY} strokeWidth={STROKE_WIDTH} />
      <line x1="14" y1="22" x2="34" y2="22" stroke={COLOR_NAVY} strokeWidth={STROKE_WIDTH} />
      <line x1="14" y1="28" x2="28" y2="28" stroke={COLOR_NAVY} strokeWidth={STROKE_WIDTH} opacity="0.5" />
    </svg>
  );
}

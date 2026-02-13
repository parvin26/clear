import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        /* CLEAR light SaaS palette – see globals.css */
        ink: "var(--color-ink)",
        "ink-muted": "var(--color-ink-muted)",
        background: "var(--color-bg)",
        surface: "var(--color-surface)",
        border: "var(--color-border)",
        divider: "var(--color-border)",
        primary: {
          DEFAULT: "var(--color-primary)",
          foreground: "#FFFFFF",
        },
        "primary-soft": "var(--color-primary-soft)",
        "primary-hover": "var(--color-primary-hover)",
        accent: "var(--color-accent)",
        "accent-soft": "var(--color-accent-soft)",
        insight: "var(--color-accent)",
        success: "var(--color-success)",
        danger: "var(--color-danger)",
        /* Backward-compat alias */
        "primary-ink": "var(--color-ink)",
        /* Legacy semantic (shadcn) */
        foreground: "hsl(var(--foreground))",
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        chart: {
          "1": "hsl(var(--chart-1))",
          "2": "hsl(var(--chart-2))",
          "3": "hsl(var(--chart-3))",
          "4": "hsl(var(--chart-4))",
          "5": "hsl(var(--chart-5))",
        },
      },
      fontFamily: {
        sans: ["var(--font-inter)", "ui-sans-serif", "system-ui", "sans-serif"],
      },
      fontSize: {
        "ds-h1": ["var(--ds-h1-size)", { lineHeight: "1.2", fontWeight: "600" }],
        "ds-h2": ["var(--ds-h2-size)", { lineHeight: "1.3", fontWeight: "600" }],
        "ds-h3": ["var(--ds-h3-size)", { lineHeight: "1.4", fontWeight: "600" }],
        "ds-body": ["var(--ds-body-size)", { lineHeight: "1.5", fontWeight: "400" }],
        "ds-small": ["var(--ds-small-size)", { lineHeight: "1.5", fontWeight: "400" }],
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
    },
  },
  plugins: [],
};

export default config;

import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}", "./tests/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        card: "hsl(var(--card))",
        "card-foreground": "hsl(var(--card-foreground))",
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
          container: "hsl(var(--primary-container))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        surface: {
          DEFAULT: "#f8f9fa",
          dim: "#d9dadb",
          container: {
            DEFAULT: "#edeeef",
            low: "#f3f4f5",
            high: "#e7e8e9",
            highest: "#e1e3e4",
            lowest: "#ffffff",
          },
        },
        "on-surface": {
          DEFAULT: "#191c1d",
          variant: "#3d4949",
        },
        outline: {
          DEFAULT: "#6d7979",
          variant: "#bcc9c8",
        },
        tertiary: {
          DEFAULT: "#006767",
          container: "#008282",
        },
        error: {
          DEFAULT: "#ba1a1a",
          container: "#ffdad6",
        },
      },
      borderRadius: {
        "2xl": "1rem",
        "3xl": "1.5rem",
        "4xl": "2rem",
        lg: "0.75rem",
        md: "0.375rem",
        sm: "0.25rem",
        xl: "0.5rem",
      },
      fontFamily: {
        sans: ["var(--font-ibm-plex-arabic)", "sans-serif"],
        display: ["var(--font-manrope)", "var(--font-ibm-plex-arabic)", "sans-serif"],
        body: ["var(--font-inter)", "var(--font-ibm-plex-arabic)", "sans-serif"],
        label: ["var(--font-inter)", "var(--font-ibm-plex-arabic)", "sans-serif"],
      },
      fontSize: {
        "display-lg": ["3.5rem", { lineHeight: "1.15", fontWeight: "800" }],
        "display-md": ["2.75rem", { lineHeight: "1.2", fontWeight: "800" }],
        "display-sm": ["2.25rem", { lineHeight: "1.25", fontWeight: "700" }],
        "headline-lg": ["2rem", { lineHeight: "1.3", fontWeight: "700" }],
        "headline-md": ["1.75rem", { lineHeight: "1.35", fontWeight: "700" }],
        "headline-sm": ["1.5rem", { lineHeight: "1.4", fontWeight: "600" }],
        "title-lg": ["1.375rem", { lineHeight: "1.4", fontWeight: "600" }],
        "title-md": ["1rem", { lineHeight: "1.5", fontWeight: "600" }],
        "body-lg": ["1rem", { lineHeight: "1.6", fontWeight: "400" }],
        "body-md": ["0.875rem", { lineHeight: "1.6", fontWeight: "400" }],
        "body-sm": ["0.75rem", { lineHeight: "1.5", fontWeight: "400" }],
        "label-lg": ["0.75rem", { lineHeight: "1.4", fontWeight: "500" }],
        "label-md": ["0.6875rem", { lineHeight: "1.4", fontWeight: "500" }],
      },
      boxShadow: {
        ambient: "0 8px 24px rgba(25, 28, 29, 0.06)",
        panel: "0 24px 60px -30px rgba(15, 23, 42, 0.15)",
      },
      spacing: {
        "spacing-8": "1.75rem",
        "spacing-10": "2.25rem",
      },
    },
  },
  plugins: [],
};

export default config;

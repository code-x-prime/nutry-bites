/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ["class"],
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      /* ─── Fonts ─── */
      fontFamily: {
        jost: ["var(--font-jost)", "sans-serif"],
        lato: ["var(--font-lato)", "sans-serif"],
        poppins: ["var(--font-poppins)", "sans-serif"],
      },

      /* ─── Nutry BitesBrand Colors ─── */
      colors: {
        /* System tokens (shadcn/ui compatible) */
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
          light: "hsl(var(--primary-light))",
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
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",

        /* Charts */
        chart: {
          1: "hsl(var(--chart-1))",
          2: "hsl(var(--chart-2))",
          3: "hsl(var(--chart-3))",
          4: "hsl(var(--chart-4))",
          5: "hsl(var(--chart-5))",
        },

        /* ── Nutry BitesNamed Palette ── */
        nyxis: {
          /* Forest Green scale */
          50: "#e8f5f2",
          100: "#c8e8e1",
          200: "#96d4c8",
          300: "#5fbfae",
          400: "#2ea896",
          500: "#1F6F78",   /* brand primary */
          600: "#0f4d3f",
          700: "#093a2f",
          800: "#062820",
          900: "#031510",
          dark: "#144D53",   /* near-black dark bg */

          /* Gold scale */
          gold: "#E6A15A",
          "gold-light": "#e8cc7a",
          "gold-dark": "#9a7a2a",
          "gold-pale": "#fdf6e3",

          /* Neutrals */
          white: "#ffffff",
          "off-white": "#f8faf9",
          "gray-100": "#f0f4f2",
          "gray-200": "#dde5e2",
          "gray-400": "#8fa89f",
          "gray-600": "#4a6059",
          "gray-900": "#144D53",
        },
      },

      /* ─── Border Radius ─── */
      borderRadius: {
        none: "0",
        sm: "calc(var(--radius) - 2px)",    /* 2px */
        DEFAULT: "var(--radius)",              /* 6px */
        md: "calc(var(--radius) + 2px)",    /* 8px */
        lg: "calc(var(--radius) + 6px)",    /* 12px */
        xl: "calc(var(--radius) + 10px)",   /* 16px */
        "2xl": "1.5rem",
        "3xl": "2rem",
        full: "9999px",
      },

      /* ─── Spacing extras ─── */
      spacing: {
        "18": "4.5rem",
        "22": "5.5rem",
        "30": "7.5rem",
        "section": "5rem",
      },

      /* ─── Typography ─── */
      fontSize: {
        "2xs": ["0.625rem", { lineHeight: "0.875rem" }],
        xs: ["0.75rem", { lineHeight: "1rem" }],
        sm: ["0.875rem", { lineHeight: "1.375rem" }],
        base: ["0.9375rem", { lineHeight: "1.65rem" }],
        lg: ["1.0625rem", { lineHeight: "1.75rem" }],
        xl: ["1.25rem", { lineHeight: "1.875rem" }],
        "2xl": ["1.5rem", { lineHeight: "2rem" }],
        "3xl": ["1.875rem", { lineHeight: "2.25rem" }],
        "4xl": ["2.25rem", { lineHeight: "2.5rem" }],
        "5xl": ["3rem", { lineHeight: "1.1" }],
        "6xl": ["3.75rem", { lineHeight: "1" }],
        "display": ["clamp(2.5rem, 6vw, 4.5rem)", { lineHeight: "1.05", letterSpacing: "-0.02em" }],
      },

      /* ─── Shadows ─── */
      boxShadow: {
        "card": "0 1px 4px rgba(0, 0, 0, 0.06)",
        "card-hover": "0 8px 24px rgba(22, 100, 84, 0.12)",
        "gold": "0 4px 16px rgba(201, 168, 76, 0.35)",
        "green": "0 4px 16px rgba(22, 100, 84, 0.28)",
        "nav": "0 2px 12px rgba(0, 0, 0, 0.06)",
        "dropdown": "0 8px 32px rgba(0, 0, 0, 0.12)",
        "modal": "0 20px 60px rgba(0, 0, 0, 0.2)",
        "inner-sm": "inset 0 1px 3px rgba(0, 0, 0, 0.08)",
      },

      /* ─── Animations / Keyframes ─── */
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
        "fade-up": {
          from: { opacity: "0", transform: "translateY(16px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        "fade-in": {
          from: { opacity: "0" },
          to: { opacity: "1" },
        },
        "scale-in": {
          from: { opacity: "0", transform: "scale(0.96)" },
          to: { opacity: "1", transform: "scale(1)" },
        },
        "shimmer": {
          "0%, 100%": { backgroundPosition: "0% 50%" },
          "50%": { backgroundPosition: "100% 50%" },
        },
        "slide-left": {
          from: { transform: "translateX(20px)", opacity: "0" },
          to: { transform: "translateX(0)", opacity: "1" },
        },
        "pulse-soft": {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.65" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "fade-up": "fade-up 0.4s ease both",
        "fade-in": "fade-in 0.35s ease both",
        "scale-in": "scale-in 0.3s ease both",
        "shimmer": "shimmer 2.5s ease infinite",
        "slide-left": "slide-left 0.35s ease both",
        "pulse-soft": "pulse-soft 2s ease-in-out infinite",
      },

      /* ─── Background Image Helpers ─── */
      backgroundImage: {
        /* Core brand gradients */
        "brand-gradient": "linear-gradient(135deg, #144D53 0%, #1F6F78 60%, #1F6F78 100%)",
        "gold-gradient": "linear-gradient(135deg, #9a7a2a 0%, #E6A15A 50%, #e8cc7a 100%)",
        "brand-to-gold": "linear-gradient(135deg, #1F6F78 0%, #E6A15A 100%)",
        "hero-gradient": "linear-gradient(160deg, #144D53 0%, #1F6F78 55%, #1F6F78 100%)",
        /* Subtle section tints */
        "section-tint": "linear-gradient(180deg, #f0faf7 0%, #ffffff 100%)",
        "gold-shimmer": "linear-gradient(90deg, #E6A15A 0%, #e8cc7a 50%, #E6A15A 100%)",
        /* Dark overlay for banners */
        "dark-overlay": "linear-gradient(to right, rgba(13,31,27,0.85) 0%, transparent 60%)",
      },

      /* ─── Z-Index ─── */
      zIndex: {
        "navbar": "100",
        "dropdown": "200",
        "overlay": "300",
        "modal": "400",
        "toast": "500",
      },

      /* ─── Transition ─── */
      transitionTimingFunction: {
        "smooth": "cubic-bezier(0.4, 0, 0.2, 1)",
        "spring": "cubic-bezier(0.34, 1.56, 0.64, 1)",
        "in-back": "cubic-bezier(0.36, 0, 0.66, -0.56)",
      },
      transitionDuration: {
        "150": "150ms",
        "250": "250ms",
        "350": "350ms",
        "450": "450ms",
      },

      /* ─── Screens (same as Tailwind defaults, just making explicit) ─── */
      screens: {
        xs: "375px",
        sm: "640px",
        md: "768px",
        lg: "1024px",
        xl: "1280px",
        "2xl": "1536px",
      },

      /* ─── Max Width ─── */
      maxWidth: {
        "content": "1280px",
        "prose-lg": "75ch",
      },
    },
  },
  plugins: [
    require("tailwindcss-animate"),
  ],
};
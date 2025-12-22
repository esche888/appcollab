import type { Config } from "tailwindcss";

export default {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        // AppCollab logo colors
        'appcollab': {
          teal: '#4ABFAB',
          'teal-dark': '#2E8B99',
          orange: '#F5A047',
          blue: '#5BA3D0',
          'blue-dark': '#3277A8',
          green: '#6BB854',
          'green-light': '#A8C952',
        },
      },
    },
  },
  plugins: [],
} satisfies Config;

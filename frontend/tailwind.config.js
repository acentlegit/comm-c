/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          primary: "#2563EB",
          primaryHover: "#1D4ED8",
          primarySoft: "#DBEAFE",
          accentTeal: "#14B8A6",
          accentSoft: "#CCFBF1",
          appBg: "#F8FAFC",
          cardBg: "#FFFFFF",
          sectionBg: "#F1F5F9",
          title: "#0F172A",
          body: "#334155",
          muted: "#64748B",
          border: "#E2E8F0",
        },
      },
      backgroundImage: {
        "sidebar-gradient": "linear-gradient(to bottom, #0EA5E9, #2563EB)",
      },
    },
  },
  plugins: [],
}

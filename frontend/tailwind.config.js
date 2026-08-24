/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        primary: "#000000",
        onPrimary: "#ffffff",
        ink: "#000000",
        inkDeep: "#090909",
        charcoal: "#525252",
        designBody: "#737373",
        mute: "#a3a3a3",
        canvas: "#ffffff",
        surfaceSoft: "#fafafa",
        hairline: "#e5e5e5",
        hairlineStrong: "#d4d4d4",
        surfaceDark: "#171717",
        onDark: "#ffffff",
        onDarkMute: "rgba(255,255,255,0.7)",
        focusRing: "rgba(59,130,246,0.5)",
        terminalRed: "#ff5f56",
        terminalYellow: "#ffbd2e",
        terminalGreen: "#27c93f",
      },
      fontFamily: {
        display: ['"Nunito"', '"SF Pro Rounded"', 'system-ui'],
        sans: ['"Inter"', 'ui-sans-serif', 'system-ui'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'monospace'],
      },
      borderRadius: { none: '0px', sm: '6px', md: '8px', lg: '12px', full: '9999px' },
      spacing: { section: '88px' },
    },
  },
  plugins: [],
}


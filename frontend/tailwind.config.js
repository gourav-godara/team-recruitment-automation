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
          yellow: '#FDE047',
          blue: '#1D4ED8',
          pink: '#FB7185',
          green: '#34D399',
          purple: '#A855F7',
          dark: '#0F172A',
          cream: '#FFFDF7',
          muted: '#F8FAFC'
        }
      },
      boxShadow: {
        'pop': '4px 4px 0px #0F172A',
        'pop-sm': '2px 2px 0px #0F172A',
        'pop-lg': '6px 6px 0px #0F172A',
        'pop-hover': '1px 1px 0px #0F172A',
        'pop-card': '5px 5px 0px #0F172A'
      },
      fontFamily: {
        display: ['"Space Grotesk"', 'sans-serif'],
        sans: ['"Plus Jakarta Sans"', 'Inter', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace']
      }
    },
  },
  plugins: [],
}

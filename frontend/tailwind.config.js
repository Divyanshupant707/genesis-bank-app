/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        ink: {
          DEFAULT: '#0B1220',
          light: '#141F35',
          lighter: '#1C2A47'
        },
        paper: '#F6F1E7',
        parchment: '#EFE7D6',
        brass: {
          DEFAULT: '#C9A227',
          light: '#E0C158',
          dark: '#9C7E1D'
        },
        vault: {
          DEFAULT: '#1F4B3F',
          light: '#2C6B58'
        },
        rust: '#B33A3A'
      },
      fontFamily: {
        display: ['"Fraunces"', 'serif'],
        body: ['"Inter"', 'sans-serif'],
        mono: ['"IBM Plex Mono"', 'monospace']
      },
      backgroundImage: {
        grain: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='120' height='120'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.035'/%3E%3C/svg%3E\")"
      },
      boxShadow: {
        stamp: '0 1px 0 rgba(201,162,39,0.4), inset 0 0 0 1px rgba(201,162,39,0.25)'
      }
    }
  },
  plugins: []
};

import type { Config } from 'tailwindcss';

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'sans-serif'],
        display: ['"Fraunces"', 'serif'],
        mono: ['"IBM Plex Mono"', 'monospace']
      },
      colors: {
        ink: '#1c2430',
        panel: '#fffdf8',
        mist: '#f2ede4',
        line: '#d8d0c2',
        accent: '#2e5e6f',
        signal: '#b88b5a',
        danger: '#b45d5d'
      },
      boxShadow: {
        card: '0 24px 60px rgba(28, 36, 48, 0.08)',
        soft: '0 10px 30px rgba(28, 36, 48, 0.06)'
      }
    }
  },
  plugins: []
} satisfies Config;

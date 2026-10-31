/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        sans: ['"Inter Variable"', 'Inter', 'system-ui', '-apple-system', 'Segoe UI', 'Roboto', 'sans-serif'],
        display: ['"Plus Jakarta Sans Variable"', '"Plus Jakarta Sans"', '"Inter Variable"', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono Variable"', '"JetBrains Mono"', 'ui-monospace', 'SFMono-Regular', 'Menlo', 'monospace'],
      },
      colors: {
        oled: '#090D16',
        cardDark: '#131B2E',
        cardElevated: '#1E293B',
        safety: {
          green: '#16A34A',
          amber: '#EAB308',
          red: '#DC2626',
          orange: '#EA580C',
          blue: '#2563EB',
        },
      },
      keyframes: {
        'sheet-up': { from: { transform: 'translateY(100%)' }, to: { transform: 'translateY(0)' } },
        'fade-in': { from: { opacity: '0' }, to: { opacity: '1' } },
        'swipe-right': { to: { transform: 'translateX(110%) rotate(8deg)', opacity: '0' } },
        'swipe-left': { to: { transform: 'translateX(-110%) rotate(-8deg)', opacity: '0' } },
        'toast-in': { from: { transform: 'translateY(-8px)', opacity: '0' }, to: { transform: 'translateY(0)', opacity: '1' } },
      },
      animation: {
        'sheet-up': 'sheet-up 0.25s cubic-bezier(.2,.8,.2,1)',
        'fade-in': 'fade-in 0.2s ease',
        'toast-in': 'toast-in 0.2s ease',
        'swipe-right': 'swipe-right 0.22s cubic-bezier(.22,1,.36,1) forwards',
        'swipe-left': 'swipe-left 0.22s cubic-bezier(.22,1,.36,1) forwards',
      },
    },
  },
  plugins: [],
}

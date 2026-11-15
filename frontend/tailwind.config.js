/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        paytm: {
          navy: '#002970',
          dark: '#001e4d',
          blue: '#0041a8',
          cyan: '#00baf2',
          lightCyan: '#e8f7fd',
          accent: '#00baf2',
          card: '#ffffff',
          bg: '#f4f7fb',
          border: '#e1e8f0',
          textDark: '#192a3e',
          textMuted: '#687b92',
          green: '#00a65a',
          lightGreen: '#e6f7ef',
          amber: '#f59e0b',
          lightAmber: '#fef3c7',
          red: '#ef4444',
          lightRed: '#fee2e2'
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
      boxShadow: {
        paytm: '0 2px 10px rgba(0, 41, 112, 0.08)',
        'paytm-lg': '0 10px 25px -5px rgba(0, 41, 112, 0.12)',
        'paytm-glow': '0 0 20px rgba(0, 186, 242, 0.35)',
      }
    },
  },
  plugins: [],
}


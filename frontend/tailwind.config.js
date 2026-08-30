/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: '#F8FAFC',
        surface: '#FFFFFF',
        'surface-subtle': '#F1F5F9',
        'surface-container': '#F8FAFC',
        'surface-hover': '#F1F5F9',
        border: '#E2E8F0',
        'border-hover': '#CBD5E1',
        primary: {
          DEFAULT: '#4648D4',
          hover: '#3739B0',
          light: '#EEF2FF',
          container: '#6063EE',
        },
        risk: {
          high: '#DC2626',
          'high-bg': '#FEE2E2',
          'high-border': '#FECACA',
          medium: '#D97706',
          'medium-bg': '#FEF3C7',
          'medium-border': '#FDE68A',
          low: '#2563EB',
          'low-bg': '#EFF6FF',
          'low-border': '#BFDBFE',
          cleared: '#16A34A',
          'cleared-bg': '#DCFCE7',
          'cleared-border': '#BBF7D0',
        }
      },
      borderRadius: {
        'xl': '12px',
        '2xl': '16px',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      }
    },
  },
  plugins: [],
}

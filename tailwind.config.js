/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        display: ['Manrope', 'Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      colors: {
        ink: '#172526',
        shell: '#f2f5f1',
        teal: { 50: '#edf8f5', 100: '#d5efe8', 500: '#278474', 600: '#1f6f63', 700: '#195950', 900: '#123b37' },
        coral: '#eb735b',
      },
      boxShadow: {
        soft: '0 18px 50px rgba(30, 57, 53, 0.08)',
      },
    },
  },
  plugins: [],
}

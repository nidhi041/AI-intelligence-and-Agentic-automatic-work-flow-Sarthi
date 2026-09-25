/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      colors: {
        workspace: '#F7F5F0',
        card: '#FFFFFF',
        'text-primary': '#20211F',
        'text-secondary': '#6F706B',
        'text-muted': '#92928B',
        accent: {
          DEFAULT: '#6B705C',
          hover: '#59604D',
          light: '#F2F3EE',
        },
        border: {
          DEFAULT: '#DDDCD5',
          soft: '#E8E6DF',
        },
        status: {
          success: '#657A63',
          'success-bg': '#F1F5F0',
          warning: '#A4773D',
          'warning-bg': '#FAF6EE',
          error: '#A85C55',
          'error-bg': '#FDF4F3',
        },
      },
    },
  },
  plugins: [],
}

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./app/**/*.{js,ts,jsx,tsx}', './pages/**/*.{js,ts,jsx,tsx}', './components/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        background: 'var(--background)',
        surface: 'var(--surface)',
        foreground: 'var(--foreground)',
        primary: 'var(--primary-gold)',
        secondary: 'var(--secondary-gray)',
        border: 'var(--border-color)',
        success: 'var(--success)',
        danger: 'var(--danger)',
        warning: 'var(--warning)',
      },
      fontFamily: {
        sans: ['var(--font-sans)', 'Arial', 'Helvetica', 'sans-serif'],
        mono: ['var(--font-mono)', 'monospace'],
      },
      borderRadius: {
        lg: '0.75rem',
        md: '0.5rem',
      },
      boxShadow: {
        card: '0 4px 12px rgba(0, 0, 0, 0.04)',
        cardDark: '0 6px 20px rgba(0, 0, 0, 0.4)',
      },
    },
  },
};

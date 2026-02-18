/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // PRD theme palette
        light: {
          bg: '#FFFFFF',
          text: '#111827',
          textSecondary: '#4B5563',
          border: '#E5E7EB',
          primary: '#2563EB',
          success: '#059669',
          error: '#DC2626',
          warning: '#F59E0B',
        },
        dark: {
          bg: '#1F2937',
          card: '#374151',
          text: '#F3F4F6',
          textSecondary: '#D1D5DB',
          border: '#374151',
          primary: '#3B82F6',
          success: '#10B981',
          error: '#EF4444',
          warning: '#FBBF24',
        },
      },
    },
  },
  plugins: [],
};

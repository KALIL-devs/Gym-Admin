/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class', // Enable class-based dark mode
  theme: {
    extend: {
      colors: {
        // ===== Base (Light & Dark) =====
        'light-bg': '#EEEEEE',        // Soft gray background
        'light-card': '#FFFFFF',      // Card / panel
        'light-text': '#121212',      // Primary text
        'light-text-secondary': '#555555',
        'light-accent': '#FF3B30',    // Energetic red-orange

        'dark-bg': '#1E1E1E',         // Dark background
        'dark-card': '#2A2A2A',       // Card / panel
        'dark-text': '#E0E0E0',       // Primary text
        'dark-text-secondary': '#A0A0A0',
        'dark-accent': '#FF3B30',     // Same energetic accent for consistency

        // ===== Functional Colors =====
        'accent-cyan': '#00ADB5',     // Secondary accent for info/hover
        'neutral-border': '#D6D6D6',  // Light border lines
        'dark-border': '#333333',     // Border lines in dark mode

        // ===== Status Colors =====
        'status-active': '#34A853',   // Paid / Active — Green
        'status-expiring': '#F9A825', // Due soon — Amber
        'status-expired': '#E63946',  // Expired — Red

        // ===== Optional Brand Shades =====
        'brand-primary': '#FF3B30',
        'brand-secondary': '#00ADB5',
      },
      fontFamily: {
        sans: ['Poppins', 'Inter', 'sans-serif'],
      },
      borderRadius: {
        'xl2': '1rem', // softer rounded corners for premium feel
      },
      boxShadow: {
        'soft': '0 2px 8px rgba(0,0,0,0.08)',
        'card': '0 4px 16px rgba(0,0,0,0.12)',
      },
    },
  },
  plugins: [],
}

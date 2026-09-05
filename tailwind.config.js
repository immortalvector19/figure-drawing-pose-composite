/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        studio: {
          900: '#121316',
          800: '#1a1c22',
          700: '#232730',
          600: '#2f3442',
          500: '#485065',
          400: '#727d98',
          300: '#9ea8bf',
          200: '#cbd2e1',
          100: '#f0f3f8',
        },
        brand: {
          500: '#3b82f6',
          600: '#2563eb',
          accent: '#06b6d4'
        },
        loomis: {
          head: '#38bdf8',       // Light sky blue
          ribcage: '#ec4899',    // Pink / Magenta
          pelvis: '#a855f7',     // Purple
          arms: '#eab308',       // Amber / Gold
          legs: '#22c55e',       // Emerald green
          extremity: '#f97316',  // Orange (hands & feet)
          contour: '#94a3b8'     // Slate for cross-contours
        }
      }
    },
  },
  plugins: [],
}

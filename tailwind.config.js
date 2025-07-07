// tailwind.config.js

/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}", // Deze regel scant al je React-componenten
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}

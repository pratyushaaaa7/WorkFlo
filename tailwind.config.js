/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx}",       // Pages (expo-router)
    "./components/**/*.{js,ts,jsx,tsx}", // Components
    "./App.{js,ts,jsx,tsx}",             // Main App entry
  ],
  theme: {
    extend: {},
  },
  plugins: [],
  presets: [require("nativewind/preset")], // ✅ Add this back!
};

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./App.{js,ts,jsx,tsx}",
    "./app/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
  ],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      fontFamily: {
        dm: ["DMSans_400Regular"],
        dmMedium: ["DMSans_500Medium"],
        dmSemiBold: ["DMSans_600SemiBold"],
        dmBold: ["DMSans_700Bold"],
      },
    },
  },

  darkMode: "class",
  plugins: [],
};

/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        pink: { DEFAULT: "#FF4FA2" },
        dark: { DEFAULT: "#0B0B0B" },
      },
    },
  },
  plugins: [],
};

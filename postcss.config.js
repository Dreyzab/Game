export default {
  plugins: {
    '@tailwindcss/postcss': {
      // Оптимизации для производительности
      content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
      ],
    },
    autoprefixer: {
      // Поддержка современных браузеров
      grid: true,
    },
  },
}

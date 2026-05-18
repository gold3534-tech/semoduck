import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#272433",
        berry: "#e85d9f",
        violet: "#8b5cf6",
        mint: "#4ecdc4",
        sun: "#ffcf5c",
        cloud: "#f6f7fb"
      },
      boxShadow: {
        soft: "0 18px 60px rgba(39, 36, 51, 0.10)"
      }
    }
  },
  plugins: []
};

export default config;

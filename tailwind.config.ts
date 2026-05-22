import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#4b3a6d",
        berry: "#8f6abb",
        violet: "#cba6e6",
        mint: "#7ccbc4",
        sun: "#ffdd57",
        cream: "#fff8ec",
        cloud: "#f7f2fb"
      },
      boxShadow: {
        soft: "0 18px 60px rgba(75, 58, 109, 0.12)"
      }
    }
  },
  plugins: []
};

export default config;

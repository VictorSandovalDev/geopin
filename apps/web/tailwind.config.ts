import type { Config } from "tailwindcss";
import preset from "@geopin/config/tailwind-preset";

const config: Config = {
  presets: [preset as any],
  content: [
    "./app/**/*.{ts,tsx}",
    "./src/**/*.{ts,tsx}",
    "../../packages/ui/src/**/*.{ts,tsx}",
  ],
};

export default config;

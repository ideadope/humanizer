import { defineConfig } from "vite";
import react, { reactCompilerPreset } from "@vitejs/plugin-react";
import babel from "@rolldown/plugin-babel";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), babel({ presets: [reactCompilerPreset()] })],
  optimizeDeps: {
    exclude: ["@ideadope/humanizer"],
  },
  build: {
    // This helps with the 'Maximum call stack' during the build phase
    commonjsOptions: {
      ignoreGlobal: true,
    },
  },
});

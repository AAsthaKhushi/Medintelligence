import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import runtimeErrorOverlay from "@replit/vite-plugin-runtime-error-modal";

// Only import cartographer in dev and when running on Replit
const plugins = [react(), runtimeErrorOverlay()];
if (process.env.NODE_ENV !== "production" && process.env.REPL_ID !== undefined) {
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const cartographer = require("@replit/vite-plugin-cartographer");
    plugins.push(cartographer());
  } catch (e) {
    // Ignore if not available
  }
}

export default defineConfig({
  plugins,
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "client", "src"),
      "@shared": path.resolve(import.meta.dirname, "shared"),
      "@assets": path.resolve(import.meta.dirname, "attached_assets"),
    },
  },
  root: path.resolve(import.meta.dirname, "client"),
  build: {
    outDir: path.resolve(import.meta.dirname, "dist/public"),
    emptyOutDir: true,
  },
  server: {
    fs: {
      strict: true,
      deny: ["**/.*"],
    },
  },
  define: {
    // Define API base URL for different environments
    __API_BASE_URL__: JSON.stringify(
      process.env.NODE_ENV === "production" 
        ? "/.netlify/functions/api" 
        : "/api"
    ),
  },
});

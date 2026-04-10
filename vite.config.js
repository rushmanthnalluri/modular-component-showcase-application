import { fileURLToPath, URL } from "node:url";
import react from "@vitejs/plugin-react-swc";
import { defineConfig } from "vite";

export default defineConfig(({ mode }) => {
  const repoName = process.env.GITHUB_REPOSITORY?.split("/")[1];

  return {
    base: "/modular-component-showcase-application/",
    server: {
      host: "::",
      port: 8080,
        proxy: {
          "/api": {
            target: "http://localhost:5000",
            changeOrigin: true,
            secure: false,
          },
          "/captcha": {
            target: "http://localhost:5000",
            changeOrigin: true,
            secure: false,
          },
        },
    },
    build: {
      rollupOptions: {
        output: {
          manualChunks: {
            react: ["react", "react-dom", "react-router-dom"],
            ui: ["@radix-ui/react-toast", "lucide-react"],
            syntax: ["react-syntax-highlighter"],
          },
        },
      },
    },
    plugins: [react()],
    resolve: {
      alias: {
        "@": fileURLToPath(new URL("./src", import.meta.url)),
      },
    },
    test: {
      // Vitest configuration — runs component/unit tests in the frontend.
      environment: "jsdom",
      globals: true,
      setupFiles: [],
      include: ["src/**/*.test.{js,jsx}"],
    },
  };
});

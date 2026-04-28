import { fileURLToPath, URL } from "node:url";
import react from "@vitejs/plugin-react-swc";
import { defineConfig } from "vite";

export default defineConfig(() => {
  const repoName = process.env.GITHUB_REPOSITORY?.split("/")[1];
  const isGitHubPagesBuild =
    process.env.GITHUB_ACTIONS === "true" && Boolean(repoName);

  return {
    base: isGitHubPagesBuild ? `/${repoName}/` : "/",
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
        "/gateway": {
          target: "http://localhost:8000",
          changeOrigin: true,
          secure: false,
          rewrite: (path) => path.replace(/^\/gateway/, ""),
        },
      },
    },
    build: {
      rollupOptions: {
        output: {
          manualChunks(id) {
            if (!id.includes("node_modules")) {
              return undefined;
            }
            if (id.includes("react-syntax-highlighter")) {
              return "syntax";
            }
            if (id.includes("@radix-ui/react-toast") || id.includes("lucide-react")) {
              return "ui";
            }
            if (id.includes("react-router-dom") || id.includes("react-dom") || id.includes("react")) {
              return "react";
            }
            return undefined;
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
      setupFiles: ["./src/tests/setupTests.js"],
      include: ["src/**/*.test.{js,jsx}"],
      coverage: {
        provider: "v8",
        reportsDirectory: "./coverage",
      },
    },
  };
});


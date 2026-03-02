import { fileURLToPath, URL } from "node:url";
import react from "@vitejs/plugin-react-swc";
import { defineConfig } from "vite";

export default defineConfig(({ mode }) => {
  const repoName = process.env.GITHUB_REPOSITORY?.split("/")[1];

  return {
    base: mode === "production" && repoName ? `/${repoName}/` : "/",
    server: {
      host: "::",
      port: 8080,
    },
    plugins: [react()],
    resolve: {
      alias: {
        "@": fileURLToPath(new URL("./src", import.meta.url)),
      },
    },
  };
});

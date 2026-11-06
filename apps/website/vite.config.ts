import { defineConfig } from "vite-plus";
import react from "@vitejs/plugin-react";

// GitHub Pages project sites are served from /<repo>/; user sites from /.
const repository = process.env.GITHUB_REPOSITORY?.split("/")[1];
const base = repository && !repository.endsWith(".github.io") ? `/${repository}/` : "/";

export default defineConfig({
  base,
  plugins: [react()],
});

import { defineConfig, loadEnv, type PluginOption } from "vite";
import tailwindcss from "@tailwindcss/vite";
import viteReact from "@vitejs/plugin-react";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";

// Standalone Vite config for the Rhytmo project — no external editor/platform
// dependency. Mirrors the previous setup (TanStack Start + Tailwind v4 +
// path aliases + Nitro build output) without any Lovable-specific tooling.
export default defineConfig(async ({ mode, command }) => {
  const env = loadEnv(mode, process.cwd(), "VITE_");
  const envDefine: Record<string, string> = {};
  for (const [key, value] of Object.entries(env)) {
    envDefine[`import.meta.env.${key}`] = JSON.stringify(value);
  }

  const plugins: PluginOption[] = [
    tailwindcss(),
    tanstackStart({
      // Redirect TanStack Start's bundled server entry to src/server.ts
      // (our SSR error wrapper). Nitro builds from this.
      server: { entry: "server" },
      importProtection: {
        behavior: "error",
        client: {
          files: ["**/server/**"],
          specifiers: ["server-only"],
        },
      },
    }),
    viteReact(),
  ];

  if (command === "build") {
    const { nitro } = await import("nitro/vite");
    plugins.push(
      nitro({
        preset: "cloudflare-module",
        // A hospedagem espera o build em dist/ (client + server); o padrão do
        // Nitro é .output/, e a verificação de artefato falha sem isto.
        output: { dir: "dist", serverDir: "dist/server", publicDir: "dist/client" },
        cloudflare: { nodeCompat: true, deployConfig: true },
      }),
    );
  }


  return {
    define: envDefine,
    css: { transformer: "lightningcss" as const },
    resolve: {
      // Substitui o vite-tsconfig-paths: o Vite lê o `paths` do tsconfig
      // sozinho desde a v8, e o próprio avisa em cada build que o plugin
      // virou redundante.
      tsconfigPaths: true,
      alias: { "@": `${process.cwd()}/src` },
      dedupe: [
        "react",
        "react-dom",
        "react/jsx-runtime",
        "react/jsx-dev-runtime",
        "@tanstack/react-query",
        "@tanstack/query-core",
      ],
    },
    optimizeDeps: {
      include: [
        "react",
        "react-dom",
        "react-dom/client",
        "react/jsx-runtime",
        "react/jsx-dev-runtime",
      ],
      ignoreOutdatedRequests: true,
    },
    server: {
      host: "::",
      port: 8080,
      // A janela de pré-visualização serve o site por um domínio externo; sem
      // isto o Vite responde 403 "This host is not allowed".
      allowedHosts: [".lovable.app", "rhytmo.com.br", ".rhytmo.com.br", "localhost"],
      // O proxy da pré-visualização é HTTPS na 443; sem isto o socket de
      // atualização automática tentaria ws://host:8080 e nunca conectaria.
      hmr: { clientPort: 443, protocol: "wss" },
    },

    plugins,
  };
});

// @lovable.dev/vite-tanstack-config already includes the following — do NOT add them manually
// or the app will break with duplicate plugins:
//   - tanstackStart, viteReact, tailwindcss, tsConfigPaths, nitro (build-only, was named "cloudflare" pre-v2),
//     componentTagger (dev-only), VITE_* env injection, @ path alias, React/TanStack dedupe,
//     error logger plugins, and sandbox detection (port/host/strictPort).
// You can pass additional config via defineConfig({ vite: { ... } }) if needed.
import { defineConfig } from "@lovable.dev/vite-tanstack-config";
import { nitro } from "nitro/vite";
import type { ConfigEnv } from "vite";

// Redirect TanStack Start's bundled server entry to src/server.ts (our SSR error wrapper),
// which wrangler.jsonc points at via "main" — nitro is what actually builds from it.
//
// nitro() is scoped to build/preview on purpose. Under `vite dev` it puts nitro's
// module-runner transport in front of SSR, which can hang and kill the request with
// "transport invoke timed out after 60000ms". TanStack Start's own dev server renders
// SSR without it, and this app has no server functions or server routes that need nitro.
// We keep lovable's `nitro: false` so its build-time copy can never double up with ours.
export default (env: ConfigEnv) =>
  defineConfig({
    nitro: false,
    plugins: env.command === "build" || env.isPreview ? [nitro()] : [],
  })(env);

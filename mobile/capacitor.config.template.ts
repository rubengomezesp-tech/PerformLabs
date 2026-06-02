import type { CapacitorConfig } from "@capacitor/cli";

/**
 * Template for a per-coach Capacitor shell. `generate-app.mjs` reads a coach
 * registry (mobile/coaches/<slug>.json) and writes a materialized copy of this
 * into mobile/generated/<slug>/capacitor.config.ts with the values filled in.
 *
 * Server mode: the native shell loads the coach's hosted member app (their host),
 * so branding flows from PerformLabs' host-based multi-tenancy — no per-coach web
 * build. Native plugins (push, splash, status bar, haptics) provide the native
 * value Apple's 4.2 guideline requires for a web-backed app.
 *
 * Values are injected from env at generate time:
 *   APP_ID, APP_NAME, MEMBER_URL, THEME_COLOR, BACKGROUND_COLOR
 */
const config: CapacitorConfig = {
  appId: process.env.APP_ID ?? "app.performlabs.app",
  appName: process.env.APP_NAME ?? "PerformLabs",
  // Unused in server mode, but required by Capacitor.
  webDir: "www",
  server: {
    url: process.env.MEMBER_URL ?? "https://app.performlabs.app/app",
    cleartext: false,
  },
  backgroundColor: process.env.BACKGROUND_COLOR ?? "#0d0d10",
  ios: {
    contentInset: "always",
  },
  android: {
    backgroundColor: process.env.BACKGROUND_COLOR ?? "#0d0d10",
  },
  plugins: {
    SplashScreen: {
      launchAutoHide: true,
      backgroundColor: process.env.BACKGROUND_COLOR ?? "#0d0d10",
      showSpinner: false,
    },
    StatusBar: {
      style: "DARK",
      backgroundColor: process.env.THEME_COLOR ?? "#0d0d10",
    },
  },
};

export default config;

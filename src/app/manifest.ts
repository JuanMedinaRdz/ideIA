import type { MetadataRoute } from "next";

/**
 * Web App Manifest. Next.js lo sirve en /manifest.webmanifest.
 *
 * Decisiones:
 *  - display: "standalone" → al instalar, se abre sin barra del browser. Se
 *    siente como app nativa.
 *  - theme_color → color de la status bar en Android. Hacemos match con
 *    --background del tema (dark purple-tinted).
 *  - icons usan los endpoints autogenerados por Next.js (ver app/icon*.tsx).
 *  - purpose: "maskable" → Android puede recortar el icono en círculo/squircle
 *    sin que se vea raro. Sin esto, queda con bordes blancos feos.
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "ideIA — Captura ideas con IA",
    short_name: "ideIA",
    description:
      "Envía ideas a WhatsApp, la IA las estructura y agenda en tu calendario.",
    start_url: "/dashboard",
    display: "standalone",
    background_color: "#0a0a0e",
    theme_color: "#0a0a0e",
    orientation: "portrait",
    categories: ["productivity", "lifestyle"],
    lang: "es",
    icons: [
      {
        src: "/icon-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icon-maskable.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}

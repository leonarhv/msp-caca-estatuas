import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    id: "/",
    name: "Caça Estátuas SP — Mapa Fácil",
    short_name: "Caça Estátuas",
    description: "Mapa e radar das estátuas da Turma da Mônica em São Paulo.",
    start_url: "/?source=pwa",
    scope: "/",
    display: "standalone",
    background_color: "#f4f2ee",
    theme_color: "#e31937",
    orientation: "portrait",
    icons: [
      {
        src: "/icon.svg",
        sizes: "any",
        type: "image/svg+xml",
        purpose: "any",
      },
    ],
  };
}

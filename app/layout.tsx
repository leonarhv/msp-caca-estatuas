import type { Metadata, Viewport } from "next";
import { Analytics } from "@vercel/analytics/next";
import PwaRegistration from "@/components/PwaRegistration";
import "./globals.css";

export const metadata: Metadata = {
  title: "Caça Estátuas SP — Mapa Fácil",
  description:
    "Mapa não-oficial das estátuas da Turma da Mônica espalhadas por São Paulo, para a promoção Caça Estátuas da Prefeitura.",
  applicationName: "Caça Estátuas SP",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Caça Estátuas",
  },
  icons: {
    apple: "/characters/monica.webp",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#e31937",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR">
      <body>
        {children}
        <PwaRegistration />
        <Analytics />
      </body>
    </html>
  );
}

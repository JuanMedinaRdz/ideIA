import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { QueryProvider } from "@/components/shared/query-provider";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "ideIA — Captura ideas con IA",
  description:
    "Envía tus ideas por WhatsApp y deja que la IA las organice automáticamente. Productividad inteligente, minimalista y enfocada.",
  // applicationName aparece como nombre en "Add to home screen" en algunos OS.
  applicationName: "ideIA",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "ideIA",
  },
  formatDetection: {
    telephone: false,
  },
};

/**
 * Viewport + theme color separados de `metadata` porque Next 16 los movió
 * a su propia export. `themeColor` controla el color de la status bar en
 * Android Chrome (PWA instalada) y el address bar en navegación normal.
 */
export const viewport: Viewport = {
  themeColor: "#0a0a0e",
  width: "device-width",
  initialScale: 1,
  // Evita zoom accidental en mobile al hacer double-tap en cards.
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="es"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="min-h-full bg-background text-foreground">
        <QueryProvider>{children}</QueryProvider>
      </body>
    </html>
  );
}

import type { Metadata } from "next";
import "leaflet/dist/leaflet.css";
import "./globals.css";
import { ToastProvider } from "@geopin/ui";
import { Nav } from "@/components/Nav";
import { I18nProvider } from "@/lib/i18n";

export const metadata: Metadata = {
  title: "GeoPin — guess the world",
  description:
    "GeoPin is a fast, multiplayer geography-guessing SaaS. Drop a pin, win the round.",
  icons: { icon: "/favicon.svg" },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen">
        <I18nProvider>
          <ToastProvider>
            <Nav />
            <main className="mx-auto w-full max-w-7xl px-4 md:px-6 py-6">
              {children}
            </main>
          </ToastProvider>
        </I18nProvider>
      </body>
    </html>
  );
}

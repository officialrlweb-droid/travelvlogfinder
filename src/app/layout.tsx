import type { Metadata, Viewport } from "next";
import { AppSplashLoader } from "@/components/AppSplashLoader";
import { TopNavProgressBar } from "@/components/TopNavProgressBar";
import "./globals.css";

export const metadata: Metadata = {
  title: "TravelVlogFinder — Find Kerala Travel Creators Matching Your Budget & Days",
  description:
    "Discover trustworthy YouTube and Instagram travel vloggers across Kerala (Wayanad, Munnar, Varkala, Kochi & more) matched to your trip duration and daily budget.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#0f5e47",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="min-h-screen antialiased selection:bg-emerald-100 selection:text-emerald-950">
        <AppSplashLoader />
        <TopNavProgressBar />
        {children}
      </body>
    </html>
  );
}

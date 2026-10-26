import type { Metadata, Viewport } from "next";
import "./globals.css";
export const viewport: Viewport = { width: "device-width", initialScale: 1, viewportFit: "cover" };
export const metadata: Metadata = {
  title: "ShipCheck — Scan. Check. Ship.",
  icons: { icon: "/brand/favicon.svg" },
  description: "Evidence-backed security checks for your next release.",
};
export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}

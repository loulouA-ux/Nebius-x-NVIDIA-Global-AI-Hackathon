import type { Metadata } from "next";
import "./globals.css";
export const metadata: Metadata = {
  title: "ShipCheck — Check before you ship",
  description: "Evidence-backed security checks for your next release.",
};
export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}

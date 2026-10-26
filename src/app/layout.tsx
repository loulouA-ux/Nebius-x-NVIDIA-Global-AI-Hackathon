import type { Metadata, Viewport } from "next";
import "./globals.css";
import {Geist, Geist_Mono} from "next/font/google";
import styles from "./workspace-styles.module.css";
const geist=Geist({subsets:["latin"],variable:"--font-geist"});
const mono=Geist_Mono({subsets:["latin"],variable:"--font-geist-mono"});
import RouteFocus from "./route-focus";
import SkipLink from "./skip-link";
export const viewport: Viewport = { width: "device-width", initialScale: 1, viewportFit: "cover" };
export const metadata: Metadata = {
  title: "ShipCheck — Scan. Check. Ship.",
  icons: { icon: "/brand/favicon.svg" },
  description: "Evidence-backed security checks for your next release.",
};
export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={`${styles.root} ${geist.variable} ${mono.variable}`}><SkipLink /><RouteFocus/>{children}</body>
    </html>
  );
}

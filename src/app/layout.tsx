import {headers} from "next/headers";
import type { Metadata, Viewport } from "next";
import "./globals.css";
import "./brand-motion.css";
import {Geist, Geist_Mono} from "next/font/google";
import styles from "./workspace-styles.module.css";
const geist=Geist({subsets:["latin"],variable:"--font-geist"});
const mono=Geist_Mono({subsets:["latin"],variable:"--font-geist-mono"});
import RouteFocus from "./route-focus";
import SkipLink from "./skip-link";
export const viewport: Viewport = { width: "device-width", initialScale: 1, viewportFit: "cover" };
export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"),
  title: "ShipTested — Check before you ship",
  icons: { icon: "/brand/favicon.svg", apple: "/brand/app-icon.svg" },
  manifest: "/manifest.webmanifest",
  openGraph: {title:"ShipTested — Check before you ship.", description:"Evidence for every finding. Tests for every fix."},
  twitter:{card:"summary_large_image",title:"ShipTested — Check before you ship."},
  description: "Pre-release security checks for small teams. ShipTested scans your lockfile, secrets and staging host, shows the evidence for every finding and tests fixes before you approve them.",
};
export default async function Layout({ children }: { children: React.ReactNode }) {
  const nonce=(await headers()).get("x-nonce")||undefined;
  return (
    <html lang="en" suppressHydrationWarning>
      <head><script nonce={nonce} dangerouslySetInnerHTML={{__html: `(function(){var m=window.matchMedia("(prefers-color-scheme: dark)");function apply(){var t;try{t=localStorage.getItem("shipcheck-theme")}catch(e){}document.documentElement.dataset.theme=t==="light"||t==="dark"?t:m.matches?"dark":"light"}apply();m.addEventListener("change",apply);window.addEventListener("storage",apply)})()`}}/></head>
      <body className={`${styles.root} ${geist.variable} ${mono.variable}`}><SkipLink /><RouteFocus/>{children}</body>
    </html>
  );
}

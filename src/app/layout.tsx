import {headers} from "next/headers";
import type { Metadata, Viewport } from "next";
import "./globals.css";
import "./brand-motion.css";
import localFont from 'next/font/local';
import styles from "./workspace-styles.module.css";
const body=localFont({src:'../../assets/fonts/inter.ttf',weight:'400 600',display:'swap',variable:'--font-body'});
const display=localFont({src:'../../assets/fonts/bricolagegrotesque.ttf',weight:'600',display:'swap',variable:'--font-display'});
const annotation=localFont({src:'../../assets/fonts/caveat.ttf',weight:'700',display:'swap',variable:'--font-annotation'});
const mono=localFont({src:'../../assets/fonts/jetbrainsmono.ttf',weight:'400 500',display:'swap',variable:'--font-mono'});
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
      <body className={`${styles.root} ${body.variable} ${display.variable} ${mono.variable} ${annotation.variable}`}><SkipLink /><RouteFocus/>{children}</body>
    </html>
  );
}

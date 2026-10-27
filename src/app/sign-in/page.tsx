"use client";
import MarkScene from '../components/voyage/mark-scene';
import Link from "next/link";
import styles from "../account-ux.module.css";
import { useEffect, useState } from "react";
import BrandHeader from "../brand-header";
export default function SignIn() {
  const [demoId, setDemoId] = useState("demo-offline");
  useEffect(() => { fetch('/api/demos?mode=availability').then(r => r.json()).then(d => { if(d.recorded) setDemoId('demo-recorded'); }).catch(() => {}); }, []);
  const [error, setError] = useState(""),
    [busy, setBusy] = useState(false);
  return (
    <><BrandHeader /><main id="main-content" tabIndex={-1} className="auth-layout">
      <section className="auth-panel">
      <MarkScene variant="gated" tone="accent"/><h1>Sign in to ShipTested</h1>
      <a className="button primary" href="/api/auth/github/start">Continue with GitHub</a>
      <p>Save reports, record review decisions and verify staging hosts. Sign-in is limited to invited preview members.</p><h2>What ShipTested can see</h2><ul><li>Your GitHub profile through read:user OAuth permission.</li><li>Repositories only after you install the GitHub App, chosen separately.</li></ul>
      <p>
        Choose GitHub above, or use the individual access key supplied by your team below. Both methods sign you in; you do not need both.
      </p>
      <details className={styles.key} open><summary>Use a team access key instead</summary><p id="access-key-hint" className={styles.hint}>Ask your workspace owner for your individual key. This is not your GitHub password.</p><form className="auth-key-form"
        onSubmit={async (event) => {
          event.preventDefault();
          setBusy(true);
          setError("");
          const form = event.currentTarget;
          const key = String(new FormData(form).get("key"));
          try {
            const r = await fetch("/api/session", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ key }),
            });
            if (!r.ok) {
              const d = await r.json();
              throw Error(d.error || "Sign-in failed.");
            }
            form.reset();
            location.assign("/reports");
          } catch (e) {
            setError(e instanceof Error ? e.message : "Sign-in failed.");
          } finally {
            setBusy(false);
          }
        }}
      >
        <label htmlFor="access-key">Individual access key</label>
        <input
          id="access-key"
          name="key"
          type="password"
          autoComplete="off"
          aria-describedby="access-key-hint"
          aria-invalid={Boolean(error)}
          required
          maxLength={100}
          style={{
            display: "block",
            width: "100%",
            padding: 12,
            margin: "12px 0",
          }}
        />
        <button className="button" disabled={busy}>
          {busy ? "Signing in…" : "Sign in"}
        </button>
      </form></details>
      <p role="alert" className={error ? "error" : undefined}>{error}</p>
      <Link href={`/reports/${demoId}`}>Run the demo</Link> · <Link href="/repairs">Dependency repairs</Link>
    </section></main></>
  );
}

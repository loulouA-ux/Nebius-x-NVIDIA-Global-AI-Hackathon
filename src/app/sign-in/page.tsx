"use client";
import {safeReturnTo} from "@/lib/auth-navigation";
import {Github as LinkGithub} from 'lucide-react';

import {LogIn as UiLogIn} from 'lucide-react';

import Link from "next/link";
import styles from "../account-ux.module.css";
import { useEffect, useState } from "react";
import BrandHeader from "../brand-header";
export default function SignIn() {
  const [next,setNext]=useState('/reports');
  const [notice,setNotice]=useState('');
  const [authError,setAuthError]=useState('');
  useEffect(()=>{
    const params=new URLSearchParams(location.search);
    setNext(safeReturnTo(params.get('next')));
    if(params.get('signedOut')==='1')setNotice('You’re signed out of ShipTested. Your saved reports are still in your workspace.');
    const reasons:Record<string,string>={cancelled:'GitHub sign-in was cancelled. Try again when you’re ready.',expired:'That sign-in link expired or belongs to another browser. Start again below.',unavailable:'GitHub sign-in could not finish. Try again, or use your individual access key.'};
    setAuthError(reasons[params.get('auth')||'']||'');
  },[]);
  const [demoId, setDemoId] = useState("demo-offline");
  useEffect(() => { fetch('/api/demos?mode=availability').then(r => r.json()).then(d => { if(d.recorded) setDemoId('demo-recorded'); }).catch(() => {}); }, []);
  const [error, setError] = useState(""),
    [busy, setBusy] = useState(false);
  return (
    <><BrandHeader /><main id="main-content" tabIndex={-1} className="auth-layout">
      <section className="auth-panel">
      <h1>Sign in to ShipTested</h1>
      {notice && <p role="status" className={styles.notice}>{notice}</p>}{authError && <p role="alert" className="error">{authError}</p>}
      <p className={styles.hint}>Continue to your workspace. We’ll return you to where you left off.</p>
      <a className="button primary" href={next==='/reports'?'/api/auth/github/start':`/api/auth/github/start?next=${encodeURIComponent(next)}`}><LinkGithub size={16} aria-hidden="true" className="action-icon"/>Continue with GitHub</a>
      <p>Use your GitHub account to access your workspace and saved reports.</p><h2>What ShipTested can see</h2><ul><li>Your GitHub profile through read:user OAuth permission.</li><li>Repositories only after you install the GitHub App, chosen separately.</li></ul>
      <p>
        Have an individual team access key? You can use it instead of GitHub.
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
              signal: AbortSignal.timeout(15000),
            });
            if (!r.ok) {
              const d = await r.json();
              throw Error(d.error || "Sign-in failed.");
            }
            form.reset();
            location.replace(next);
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
          aria-describedby={error ? "access-key-hint access-key-error" : "access-key-hint"}
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
        <button className="button" disabled={busy}><UiLogIn size={16} aria-hidden="true" className="action-icon"/>
          {busy ? "Signing in…" : "Sign in"}
        </button>
      </form></details>
      <p id="access-key-error" role="alert" className={error ? "error" : undefined}>{error}</p>
      <Link href={`/reports/${demoId}`}>Run the demo</Link> · <Link href="/repairs">Dependency repairs</Link>
    </section></main></>
  );
}

"use client";
import { useState } from "react";
import BrandHeader from "../brand-header";
export default function SignIn() {
  const [error, setError] = useState(""),
    [busy, setBusy] = useState(false);
  return (
    <><BrandHeader /><main className="auth-layout">
      <section className="auth-story"><span className="eyebrow">EVIDENCE BEFORE DEPLOYMENT</span><h2>Scan. Check.<br/>Ship.</h2><p>One workspace for findings, supported repairs and the evidence behind your next decision.</p><img src="/brand/symbol.svg" width={160} height={136} alt=""/><p className="auth-assurance">Repository access stays separate. You choose what to connect.</p></section>
      <section className="auth-panel"><span className="eyebrow">MEMBER ACCESS</span>
      <h1>Sign in to ShipCheck</h1>
      <a className="button primary" href="/api/auth/github/start">Continue with GitHub</a>
      <p>GitHub sign-in is available to invited preview members. Repository permissions are requested separately.</p>
      <p>
        Use your individual team access key for live scans. The offline demo is
        available without signing in.
      </p>
      <form className="auth-key-form"
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
            location.assign("/");
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
          required
          maxLength={100}
          style={{
            display: "block",
            width: "100%",
            padding: 12,
            margin: "12px 0",
          }}
        />
        <button className="button primary" disabled={busy}>
          {busy ? "Signing in…" : "Sign in"}
        </button>
      </form>
      <p role="alert" className={error ? "error" : undefined}>{error}</p>
      <a href="/">Return to demo</a> · <a href="/repairs">Dependency repairs</a>
    </section></main></>
  );
}

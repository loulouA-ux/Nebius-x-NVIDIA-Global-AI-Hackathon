"use client";
import { useState } from "react";
export default function SignIn() {
  const [error, setError] = useState(""),
    [busy, setBusy] = useState(false);
  return (
    <main style={{ maxWidth: 520, margin: "80px auto", padding: 24 }}>
      <h1>Sign in to ShipCheck</h1>
      <p>
        Use your individual team access key for live scans. The offline demo is
        available without signing in.
      </p>
      <form
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
      <p role="alert">{error}</p>
      <a href="/">Return to demo</a>
    </main>
  );
}

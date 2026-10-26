"use client";
import {clearReportMemory} from "./report-memory";
import Link from "next/link";
import styles from "./account-ux.module.css";
import { useEffect, useState } from "react";
import type { ScanReport } from "@/lib/types";
import { notifySessionExpired, sessionExpiredEvent } from "./session-expired";
type Saved = { id: string; created_at: string; status: string };
export default function MemberControls({
  refresh,
  onReport,
  accountOnly=false,
}: {
  accountOnly?: boolean;
  refresh: string;
  onReport: (report: ScanReport) => void;
}) {
  const [member, setMember] = useState(""),
    [scans, setScans] = useState<Saved[]>([]),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false),
    [loaded, setLoaded] = useState(false);
  useEffect(() => {
    function expire() {
      if (!member) return;
      setMember("");
      setScans([]);
      setLoaded(true);
      setError("Session expired. Sign in again to continue.");
    }
    window.addEventListener(sessionExpiredEvent, expire);
    return () => window.removeEventListener(sessionExpiredEvent, expire);
  }, [member]);
  useEffect(() => {
    let active = true;
    async function load() {
      try {
        const r = await fetch("/api/session", { cache: "no-store" });
        if (r.status === 401) {
          if (active) {
            setMember("");
            setScans([]);
          }
          return;
        }
        if (!r.ok) throw Error("Member access temporarily unavailable.");
        const d = await r.json();
        if (active) setMember(d.actor.id);
        if (accountOnly) return;
        const history = await fetch("/api/scans", { cache: "no-store" });
        if (history.status === 401) {
          if (active) {
            setMember("");
            setScans([]);
            setError("Session expired. Sign in again to continue.");
          }
          return;
        }
        if (!history.ok) throw Error("Saved scans could not be loaded.");
        const h = await history.json();
        if (active) {
          setMember(d.actor.id);
          setScans(h.scans);
          setError("");
        }
      } catch (e) {
        if (active)
          setError(
            e instanceof Error ? e.message : "Member access unavailable.",
          );
      } finally {
        if (active) setLoaded(true);
      }
    }
    void load();
    return () => {
      active = false;
    };
  }, [refresh, accountOnly]);
  async function open(id: string) {
    if (!id) return;
    setBusy(true);
    setError("");
    try {
      const r = await fetch(`/api/scans/${id}`, { cache: "no-store" });
      if (r.status === 401) {
        notifySessionExpired();
        return;
      }
      if (!r.ok) throw Error("Saved report unavailable.");
      const d = await r.json();
      onReport(d.report);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not load report.");
    } finally {
      setBusy(false);
    }
  }
  return (
    <section aria-label="Member access" className={`member-access ${styles.account}`}>
      <div className={styles.row}>
        {member ? (
          <>
            <span className={styles.identity}><strong>{member.startsWith("github:") ? "GitHub account" : "Team member"}</strong><small>Signed in as {member}</small></span>
            {!accountOnly&&<div className={styles.history}><label htmlFor="saved-scan">Saved scans</label>
            <select
              id="saved-scan"
              aria-label="Saved scans"
              value=""
              disabled={busy}
              onChange={(e) => void open(e.target.value)}
              style={{ maxWidth: "100%", padding: 8 }}
            >
              <option value="">Choose a report ({scans.length})</option>
              {scans.map((s) => (
                <option key={s.id} value={s.id}>
                  {new Date(s.created_at).toLocaleString("en-GB")} · {s.status}
                </option>
              ))}
            </select></div>}
            <button
              className="button"
              disabled={busy}
              onClick={async () => {
                setBusy(true);
                try {
                  const r = await fetch("/api/session", { method: "DELETE" });
                  if (!r.ok) throw Error("Sign-out failed.");
                  clearReportMemory();
                  location.assign("/");
                } catch {
                  setError("Sign-out failed. Please try again.");
                  setBusy(false);
                }
              }}
            >
              Sign out
            </button>
          </>
        ) : loaded ? (
          <><span className={styles.hint}>Demo mode · Sign in to save scans and connect repositories.</span><Link className="button" href="/sign-in">Member sign in</Link></>
        ) : (
          <span>Checking member session…</span>
        )}
      </div>
      {error && (
        <p role="alert" className="error">
          {error}
        </p>
      )}
    </section>
  );
}

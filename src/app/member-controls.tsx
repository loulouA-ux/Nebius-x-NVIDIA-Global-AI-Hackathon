"use client";
import {LogOut as UiLogOut, LogIn, RefreshCw, UserRound} from 'lucide-react';
import {usePathname} from 'next/navigation';
import {signInHref} from '@/lib/auth-navigation';

import {verdictLabel} from "./components/presentation";
import {clearReportMemory} from "./report-memory";
import Link from "next/link";
import styles from "./account-ux.module.css";
import { useEffect, useState } from "react";
import type { ScanReport } from "@/lib/types";
import { notifySessionExpired, sessionExpiredEvent } from "./session-expired";
export type Saved = { id: string; created_at: string; status: string };
export default function MemberControls({
  refresh,
  onReport,
  accountOnly=false,
  onHistory,
}: {
  accountOnly?: boolean;
  onHistory?:(value:{signedIn:boolean;scans:Saved[];error:string})=>void;
  refresh: string;
  onReport: (report: ScanReport) => void;
}) {
  const pathname=usePathname();
  const [retry,setRetry]=useState(0);
  const [signingOut,setSigningOut]=useState(false);
  const [github,setGithub]=useState(false);
  const [member, setMember] = useState(""),
    [scans, setScans] = useState<Saved[]>([]),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false),
    [loaded, setLoaded] = useState(false);
  useEffect(()=>{onHistory?.({signedIn:!!member,scans,error});},[member,scans,error,onHistory]);
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
    const controller=new AbortController();
    const timeout=setTimeout(()=>controller.abort(),15000);
    async function load() {
      try {
        const r = await fetch("/api/session", { cache: "no-store", signal: controller.signal });
        if (r.status === 403) {const data=await r.json();if(data.publicDemo){if(active){setMember("");setError(data.error);setScans([]);}return;}}
        if (r.status === 401) {
          if (active) {
            setMember("");
            setScans([]);
          }
          return;
        }
        if (!r.ok) throw Error("Member access temporarily unavailable.");
        const d = await r.json();
        if (active) {setMember(d.login || d.actor.id);setGithub(d.actor.id.startsWith("github:"));setError("");}
        if (accountOnly) return;
        const history = await fetch("/api/scans", { cache: "no-store", signal: controller.signal });
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
          setMember(d.login || d.actor.id);
          setScans(h.scans);
          setError("");
        }
      } catch (e) {
        if (active)
          setError(
            e instanceof Error ? e.message : "Member access unavailable.",
          );
      } finally {
        clearTimeout(timeout);
        if (active) setLoaded(true);
      }
    }
    void load();
    return () => {
      active = false;
      clearTimeout(timeout);
      controller.abort();
    };
  }, [refresh, accountOnly,retry]);
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
            <span className={styles.identity}><UserRound size={18} aria-hidden="true"/><strong>{github ? "GitHub account" : "Team member"}</strong><small>Signed in as {member}</small></span>
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
                  {new Date(s.created_at).toLocaleString("en-GB")} · {verdictLabel(s.status as ScanReport["status"])||s.status}
                </option>
              ))}
            </select></div>}
            <button
              className="button"
              disabled={busy||signingOut}
              onClick={async () => {
                setSigningOut(true);
                setError("");
                try {
                  const r = await fetch("/api/session", { method: "DELETE", signal: AbortSignal.timeout(15000) });
                  if (!r.ok) throw Error("Sign-out failed.");
                  clearReportMemory();
                  location.replace("/sign-in?signedOut=1");
                } catch {
                  setError("Could not confirm sign-out. Please try again.");
                  setSigningOut(false);
                }
              }}
            ><UiLogOut size={16} aria-hidden="true" className="action-icon"/>
              {signingOut ? "Signing out…" : "Sign out"}
            </button>
          </>
        ) : loaded ? (
          <><span className={styles.hint}>You’re signed out</span><Link className="text-button" href={signInHref(pathname)}><LogIn size={16} aria-hidden="true" className="action-icon"/>Sign in with GitHub</Link></>
        ) : (
          <span>Checking member session…</span>
        )}
      </div>
      {error && (
        <p role="alert" className="error">
          <span>{error}</span>
          {!signingOut && <button className="text-button" onClick={()=>{setError("");setLoaded(false);setRetry(v=>v+1);}}><RefreshCw size={16} aria-hidden="true" className="action-icon"/>Check session again</button>}
        </p>
      )}
    </section>
  );
}

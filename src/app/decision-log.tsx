"use client";
import {Check as UiCheck,X as UiX,RefreshCw as UiRefreshCw} from 'lucide-react';

import Toast from "./components/toast";
import { useEffect, useState } from "react";
import type { ScanReport } from "@/lib/types";
import { notifySessionExpired } from "./session-expired";
type Decision = {
  id: string;
  finding_id: string;
  action: string;
  reason: string;
  created_at: string;
};
export default function DecisionLog({
  report,
  findingId,
}: {
  report: ScanReport;
  findingId: string;
}) {
  const [success,setSuccess]=useState(0);
  const [events, setEvents] = useState<Decision[]>([]),
    [reason, setReason] = useState(""),
    [error, setError] = useState(""),
    [expired, setExpired] = useState(false),
    [busy, setBusy] = useState(false),
    [loading, setLoading] = useState(report.mode !== "demo"),
    [historyError, setHistoryError] = useState(""),
    [reload, setReload] = useState(0);
  useEffect(() => {
    let active = true;
    setEvents([]); setExpired(false); setError(""); setHistoryError("");
    if (report.mode === "demo") { setLoading(false); return; }
    setLoading(true);
    fetch(`/api/scans/${report.id}`, { cache: "no-store" })
      .then(async (r) => {
        if (r.status === 401) {
          notifySessionExpired();
          if (active) setExpired(true);
          throw Error("Session expired. Sign in again to review decisions.");
        }
        if (!r.ok) throw Error("Decision history unavailable.");
        const d = await r.json();
        if (active) setEvents(d.decisions);
      })
      .catch((cause) => {
        if (active) setHistoryError(cause instanceof Error ? cause.message : "Decision history unavailable.");
      }).finally(() => { if(active) setLoading(false); });
    return () => {
      active = false;
    };
  }, [report.id, report.mode, reload]);
  async function record(action: "acknowledge" | "dismiss") {
    setBusy(true);
    setError("");
    try {
      const r = await fetch(`/api/scans/${report.id}/decisions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ findingId, action, reason }),
      });
      if (r.status === 401) {
        notifySessionExpired();
        setExpired(true);
        throw Error("Session expired. Sign in again to save a decision.");
      }
      const d = await r.json();
      if (!r.ok) throw Error(d.error || "Decision could not be saved.");
      setEvents((current) => [...current, d]);
      setReason("");setSuccess(n=>n+1);
      window.dispatchEvent(new CustomEvent("shipcheck:decision-recorded", { detail: { reportId: report.id } }));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Decision could not be saved.");
    } finally {
      setBusy(false);
    }
  }
  return (
    <section className="panel">
      <h2>Review decision</h2>{success>0&&<Toast key={success} message="Decision recorded. The finding and verdict are unchanged."/>}
      <p>
        Record your assessment. This does not resolve the finding or change the
        scan verdict.
      </p>
      {report.mode === "demo" ? (
        <div><p>Sign in to record a decision. Demo decisions are not saved.</p><button className="button" disabled><UiCheck size={16} aria-hidden="true" className="action-icon"/>Acknowledge</button> <button className="button" disabled><UiX size={16} aria-hidden="true" className="action-icon"/>Dismiss with reason</button> <a href="/sign-in">Sign in</a></div>
      ) : expired ? (
        <p role="alert" className="error">
          Session expired. <a href="/sign-in">Sign in again</a> to review or save decisions.
        </p>
      ) : (
        <>
          <label htmlFor="decision-reason">Reason or review note</label>
          <textarea
            id="decision-reason"
            value={reason}
            maxLength={1000}
            onChange={(e) => setReason(e.target.value)}
            style={{
              display: "block",
              width: "100%",
              minHeight: 80,
              margin: "12px 0",
              padding: 12,
            }}
          />
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
            <button
              className="button"
              disabled={busy}
              onClick={() => void record("acknowledge")}
            ><UiCheck size={16} aria-hidden="true" className="action-icon"/>
              Acknowledge
            </button>
            <button
              className="button"
              disabled={busy || !reason.trim()}
              onClick={() => void record("dismiss")}
            ><UiX size={16} aria-hidden="true" className="action-icon"/>
              Dismiss with reason
            </button>
          </div>
          {error && !expired && (
            <p role="alert" className="error">
              {error}
            </p>
          )}
          {loading && <p role="status">Loading decision history…</p>}
          {historyError && <p role="alert">{historyError} <button className="button" onClick={() => setReload(n => n + 1)}><UiRefreshCw size={16} aria-hidden="true" className="action-icon"/>Reload history</button></p>}
          {!loading && !historyError && !events.some(d => d.finding_id === findingId) && <p className="quiet-note">No decisions recorded for this finding.</p>}
          <ol aria-label="Decision history">
            {events
              .filter((d) => d.finding_id === findingId)
              .map((d) => (
                <li key={d.id}>
                  <strong>{d.action}</strong> ·{" "}
                  {new Date(d.created_at).toLocaleString("en-GB")}
                  <p>{d.reason || "No note provided."}</p>
                </li>
              ))}
          </ol>
        </>
      )}
    </section>
  );
}

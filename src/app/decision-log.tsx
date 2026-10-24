"use client";
import { useEffect, useState } from "react";
import type { ScanReport } from "@/lib/types";
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
  const [events, setEvents] = useState<Decision[]>([]),
    [reason, setReason] = useState(""),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false);
  useEffect(() => {
    let active = true;
    if (report.mode === "demo") return;
    fetch(`/api/scans/${report.id}`, { cache: "no-store" })
      .then(async (r) => {
        if (!r.ok) throw Error("Decision history unavailable.");
        const d = await r.json();
        if (active) setEvents(d.decisions);
      })
      .catch(() => {
        if (active) setError("Decision history unavailable.");
      });
    return () => {
      active = false;
    };
  }, [report.id, report.mode]);
  async function record(action: "acknowledge" | "dismiss") {
    setBusy(true);
    setError("");
    try {
      const r = await fetch(`/api/scans/${report.id}/decisions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ findingId, action, reason }),
      });
      const d = await r.json();
      if (!r.ok) throw Error(d.error || "Decision could not be saved.");
      setEvents((current) => [...current, d]);
      setReason("");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Decision could not be saved.");
    } finally {
      setBusy(false);
    }
  }
  return (
    <section className="panel">
      <h2>Review decision</h2>
      <p>
        Record your assessment. This does not resolve the finding or change the
        scan verdict.
      </p>
      {report.mode === "demo" ? (
        <p>
          Decision history is available for saved member scans. This offline
          demo is temporary.
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
              className="button primary"
              disabled={busy}
              onClick={() => void record("acknowledge")}
            >
              Acknowledge
            </button>
            <button
              className="button"
              disabled={busy || !reason.trim()}
              onClick={() => void record("dismiss")}
            >
              Dismiss with reason
            </button>
          </div>
          {error && (
            <p role="alert" className="error">
              {error}
            </p>
          )}
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

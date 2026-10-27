import type {Query} from './db';
import type {Actor} from './store';
import {TeamAccess} from './team-access';
export async function workspaceUsage(query:Query,actor:Actor) {
  const role=await new TeamAccess(query).role(actor),workspaceWide=role==='owner'||role==='admin';
  const [allowance]=await query("SELECT period_start,scan_limit,reserved FROM sc_scan_allowances WHERE workspace_id=$1 AND period_start=date_trunc('month',now() AT TIME ZONE 'UTC')::date",[actor.workspaceId]);
  const scope=workspaceWide?null:actor.id;
  const outcomes=await query("SELECT state,count(*)::int AS count FROM sc_scan_jobs WHERE workspace_id=$1 AND ($2::text IS NULL OR owner_id=$2) AND period_start=date_trunc('month',now() AT TIME ZONE 'UTC')::date GROUP BY state",[actor.workspaceId,scope]);
  const verdicts=await query(`SELECT s.report->>'status' AS verdict,count(*)::int AS count FROM sc_scan_jobs j JOIN sc_scans s ON s.id=j.report_id
    WHERE j.workspace_id=$1 AND ($2::text IS NULL OR j.owner_id=$2) AND j.period_start=date_trunc('month',now() AT TIME ZONE 'UTC')::date GROUP BY s.report->>'status'`,[actor.workspaceId,scope]);
  const daily=await query(`SELECT (created_at AT TIME ZONE 'UTC')::date::text AS day,count(*)::int AS count FROM sc_scan_jobs
    WHERE workspace_id=$1 AND ($2::text IS NULL OR owner_id=$2) AND created_at>=now()-interval '7 days' GROUP BY day ORDER BY day`,[actor.workspaceId,scope]);
  const [timing]=await query(`SELECT count(*)::int AS reports,round(avg((s.report->>'durationMs')::numeric))::int AS average_ms
    FROM sc_scan_jobs j JOIN sc_scans s ON s.id=j.report_id WHERE j.workspace_id=$1 AND ($2::text IS NULL OR j.owner_id=$2)
    AND j.period_start=date_trunc('month',now() AT TIME ZONE 'UTC')::date`,[actor.workspaceId,scope]);
  return {configured:!!allowance,limit:Number(allowance?.scan_limit??0),reserved:Number(allowance?.reserved??0),remaining:Math.max(0,Number(allowance?.scan_limit??0)-Number(allowance?.reserved??0)),periodStart:allowance?.period_start??null,scope:workspaceWide?'workspace':'your scans',outcomes,verdicts,daily,completedReports:Number(timing?.reports??0),averageDurationMs:timing?.average_ms??null,cost:{state:'not_metered',detail:'Provider and hosting costs are not yet metered; no cost estimate is presented.'}};
}

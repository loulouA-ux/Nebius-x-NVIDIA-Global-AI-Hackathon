import {describe,it,expect} from 'vitest';
import {completedStage,reportEvents,voyageOutcome} from '../src/app/components/voyage/events';
import {visibleMoments} from '../src/app/components/voyage/voyage-moment';
import {recordedDemo} from '../src/lib/server/demo-report';
describe('evidence-driven voyage',()=>{
 it('waits until contiguous real stages complete',()=>{expect(completedStage([])).toBe(-1);expect(completedStage([{stage:'OSV',status:'done',tone:'ok'}])).toBe(-1);expect(completedStage([{stage:'Lockfile',status:'done',tone:'ok'}])).toBe(0);});
 it('never labels a failed stage clear',()=>expect(voyageOutcome([{stage:'OSV',status:'failed',tone:'neutral'}],'Checks passed')).toBe('Incomplete'));
 it('uses recorded evidence, not illustrative example numbers',()=>{const r=recordedDemo(),e=reportEvents(r);expect(e[0].detail).toBe(`${r.dependencies.length} resolved dependencies`);expect(e[2].detail).toBe('5 advisories · 2 high');expect(e[3].detail).toContain(`${r.sources.length} sources`);expect(e[4].detail).toContain(`${r.explanations.length}`);});
 it('limits moments to two and phone to one',()=>{const e=reportEvents(recordedDemo());expect(visibleMoments(e)).toHaveLength(2);expect(visibleMoments(e,true)).toHaveLength(1);expect(visibleMoments([])).toHaveLength(0);});
});

import {createElement} from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import VoyageMoment from '../src/app/components/voyage/voyage-moment';
import DryDock from '../src/app/components/voyage/dry-dock';
import type {RepairRun} from '../src/lib/repair/runner';
it('missing moment details never invent values',()=>{const html=renderToStaticMarkup(createElement(VoyageMoment,{event:{stage:'OSV',status:'done',tone:'ok'},index:2}));expect(html).toContain('OSV');expect(html).toContain('aria-hidden="true"');expect(html).not.toContain('advisories');});
it('dry dock recognizes the runner command and never raises a failed flag',()=>{const run:RepairRun={planHash:'fixture',status:'passed',cleanupComplete:true,errors:[],baseline:[{command:'npm run test --ignore-scripts',exitCode:0,output:'test output'}],patched:[{command:'npm run test --ignore-scripts',exitCode:0,output:'test output'}]};expect(renderToStaticMarkup(createElement(DryDock,{run}))).toContain('dock-flag');run.patched[0].exitCode=1;run.status='failed';const html=renderToStaticMarkup(createElement(DryDock,{run}));expect(html).not.toContain('dock-flag');expect(html).toContain('Test command failed');});

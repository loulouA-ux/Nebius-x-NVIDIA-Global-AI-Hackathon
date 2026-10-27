import {describe,it,expect} from 'vitest';
import {advisoryMetadata,cvssBase,groupByPackage} from '../src/lib/advisory-metadata';
import type {Finding} from '../src/lib/types';
const dep={name:'example',version:'1.5.0',ecosystem:'npm' as const,path:'node_modules/example'};
describe('advisory metadata',()=>{
 for(const [input,expected] of [['CRITICAL','high'],['HIGH','high'],['MODERATE','medium'],['LOW','low']])it(`maps ${input}`,()=>expect(advisoryMetadata({database_specific:{severity:input}},dep).severity).toBe(expected));
 for(const [vector,score] of [['CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:U/C:H/I:H/A:H',9.8],['CVSS:3.1/AV:L/AC:L/PR:L/UI:N/S:U/C:H/I:H/A:H',7.8],['CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:U/C:L/I:N/A:N',5.3],['CVSS:3.1/AV:P/AC:H/PR:H/UI:R/S:U/C:L/I:N/A:N',1.6],['CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:U/C:N/I:N/A:N',0]] as const)it(`computes ${score}`,()=>expect(cvssBase(vector)).toBe(score));
 it('does not guess malformed scores',()=>{expect(cvssBase('9.8')).toBeUndefined();expect(cvssBase('CVSS:3.1/AV:N')).toBeUndefined();expect(advisoryMetadata({},dep).severity).toBe('review');});
 it('uses CVSS thresholds and database precedence',()=>{for(const [vector,expected] of [['AV:N/AC:L/PR:N/UI:N/S:U/C:H/I:H/A:H','high'],['AV:N/AC:L/PR:N/UI:N/S:U/C:L/I:N/A:N','medium'],['AV:P/AC:H/PR:H/UI:R/S:U/C:L/I:N/A:N','low']])expect(advisoryMetadata({severity:[{type:'CVSS_V3',score:'CVSS:3.1/'+vector}]},dep).severity).toBe(expected);});
 it('binds fixed versions to package and containing interval',()=>{
 const affected=[{package:{name:'example',ecosystem:'npm'},ranges:[{type:'SEMVER',events:[{introduced:'0'},{fixed:'1.0.0'},{introduced:'1.4.0'},{fixed:'1.6.0'}]}]}];
 expect(advisoryMetadata({affected},dep).fixedVersion).toBe('1.6.0');expect(advisoryMetadata({affected},{...dep,name:'other'}).fixedVersion).toBeUndefined();expect(advisoryMetadata({affected},{...dep,version:'1.7.0'}).fixedVersion).toBeUndefined();
 });
 it('groups without dropping findings or inventing a common fix',()=>{const f:Finding={id:'a',title:'a',severity:'low',description:'',action:'',evidence:[{kind:'advisory',dependency:dep,location:'',excerpt:''}],fixedVersion:'1.6.0'};const groups=groupByPackage([f,{...f,id:'b',severity:'high',fixedVersion:undefined}]);expect(groups).toHaveLength(1);expect(groups[0].severity).toBe('high');expect(groups[0].findings).toHaveLength(2);expect(groups[0].fixedVersion).toBeUndefined();});
});

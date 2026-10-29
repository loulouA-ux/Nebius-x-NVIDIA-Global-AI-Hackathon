import {test,expect} from 'vitest';
import {PGlite} from '@electric-sql/pglite';
import {readMigrationStatements} from '../scripts/migration-statements';
test('migration runner applies the complete schema twice including comments with semicolons',async()=>{
 const db=new PGlite();
 try {
  const statements=readMigrationStatements(new URL('../migrations/',import.meta.url));
  for(let pass=0;pass<2;pass++)for(const sql of statements)await db.query(sql);
  const result=await db.query("select count(*)::int as count from information_schema.tables where table_name='sc_batch_plans'");
  expect(result.rows).toEqual([{count:1}]);
 }finally{await db.close();}
});

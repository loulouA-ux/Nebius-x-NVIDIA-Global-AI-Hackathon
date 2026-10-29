import {database} from '../src/lib/server/db';
import {reconcileBilling} from '../src/lib/server/billing';
try {console.log(JSON.stringify(await reconcileBilling(database())));}
catch {console.error('Billing reconciliation failed; no provider details or credentials logged.');process.exitCode=1;}

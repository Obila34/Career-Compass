import fs from 'fs';
let s = fs.readFileSync('server.ts', 'utf8');
s = s.replace('console.warn("Falling back to MOCK_NETWORK_USERS for referrers", dbErr);', 'console.warn("Falling back to MOCK_NETWORK_USERS for referrers");');
s = s.replace('console.warn("Ignored admin write failure for submit (demo mode or bad key)", dbErr);', 'console.warn("Ignored admin write failure for submit (demo mode or bad key)");');
fs.writeFileSync('server.ts', s);

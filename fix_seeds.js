import fs from 'fs';
let jobs = fs.readFileSync('src/lib/seeds/seedJobs.ts', 'utf8');
jobs = jobs.replace(/import \{.*?\} from 'firebase-admin\/firestore';/g, '');
jobs = jobs.replace(/import \{.*?\} from '\.\.\/firebase\/admin';/g, '');
jobs = jobs.replace(/Timestamp\.now\(\)/g, '{ toDate: () => new Date() } as any');
jobs = jobs.replace(/Timestamp\.fromDate\((.*?)\)/g, '{ toDate: () => $1 } as any');
fs.writeFileSync('src/lib/seeds/seedJobs.ts', jobs);

let profiles = fs.readFileSync('src/lib/seeds/seedNetworkProfiles.ts', 'utf8');
profiles = profiles.replace(/import \{.*?\} from 'firebase-admin\/firestore';/g, '');
profiles = profiles.replace(/import \{.*?\} from '\.\.\/firebase\/admin';/g, '');
profiles = profiles.replace(/Timestamp\.now\(\)/g, '{ toDate: () => new Date() } as any');
profiles = profiles.replace(/Timestamp\.fromDate\((.*?)\)/g, '{ toDate: () => $1 } as any');
fs.writeFileSync('src/lib/seeds/seedNetworkProfiles.ts', profiles);
console.log('Fixed seeds');

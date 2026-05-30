import fs from 'fs';
let content = fs.readFileSync('src/lib/seeds/seedJobs.ts', 'utf8');
content = content.replace(/\{ toDate: \(\) => new Date\(Date.now\( \} as any - (.*?)\)\)/g, '{ toDate: () => new Date(Date.now() - $1) } as any');
// Just in case, replace any weird Timestamp remnants
content = content.replace(/\{ toDate: \(\) => new Date\(Date\.now\( \} as any(.*)/g, '{ toDate: () => new Date(Date.now() $1 } as any');
fs.writeFileSync('src/lib/seeds/seedJobs.ts', content);

let profiles = fs.readFileSync('src/lib/seeds/seedNetworkProfiles.ts', 'utf8');
profiles = profiles.replace(/\{ toDate: \(\) => new Date\(Date.now\( \} as any - (.*?)\)\)/g, '{ toDate: () => new Date(Date.now() - $1) } as any');
fs.writeFileSync('src/lib/seeds/seedNetworkProfiles.ts', profiles);
console.log('Fixed seeds again');

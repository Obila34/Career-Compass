import * as adminModule from 'firebase-admin';
const admin = (adminModule as any).default || adminModule;
import * as dotenv from 'dotenv';
dotenv.config();

let pk = process.env.FIREBASE_PRIVATE_KEY || "";
console.log("Original PK:", pk.substring(0, 50));

try { pk = JSON.parse(pk); console.log("JSON parsed"); } catch (e) { console.log("Not JSON"); }
if (pk.startsWith('"') && pk.endsWith('"')) { pk = pk.slice(1, -1); console.log("Sliced quotes"); }
pk = pk.replace(/\\n/g, '\n');
console.log("Replaced new lines");

console.log("PK After:", pk.substring(0, 50));

try {
  admin.initializeApp({
      credential: admin.credential.cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: pk,
      }),
  });
  console.log("Success with cert");
} catch (e) {
  console.error("FAIL:", e);
}

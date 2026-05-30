import * as adminModule from 'firebase-admin';
const admin = (adminModule as any).default || adminModule;
import { getFirestore } from 'firebase-admin/firestore';
import fs from 'fs';
import path from 'path';

let _adminDb: adminModule.firestore.Firestore | null = null;
let _adminAuth: adminModule.auth.Auth | null = null;
let _adminStorage: adminModule.storage.Storage | null = null;

let _databaseId: string | undefined;

try {
  const configPath = path.resolve(process.cwd(), 'firebase-applet-config.json');
  if (fs.existsSync(configPath)) {
    const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
    _databaseId = config.firestoreDatabaseId;
  }
} catch (e) {
  console.warn("Could not read firebase-applet-config.json");
}

function getAdminApp() {
  if (!admin.apps?.length && !(admin as any).default?.apps?.length) {
    if (process.env.FIREBASE_PRIVATE_KEY) {
      let pk = process.env.FIREBASE_PRIVATE_KEY;
      let clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
      let projectId = process.env.FIREBASE_PROJECT_ID;

      try {
        // Did the user paste the entire JSON string into FIREBASE_PRIVATE_KEY?
        const parsed = JSON.parse(pk);
        if (parsed && parsed.private_key) {
          pk = parsed.private_key;
        }
        if (parsed && parsed.client_email) {
          clientEmail = parsed.client_email;
        }
        if (parsed && parsed.project_id) {
          projectId = parsed.project_id;
        }
      } catch (e) {
        // Not a JSON string, continue
      }

      if (pk.startsWith('"') && pk.endsWith('"')) {
        pk = pk.slice(1, -1);
      }
      pk = pk.split('\\n').join('\n');
      
      // Some keys might just use literal newline chars inside the string, but JSON.parse often gives actual \n 
      // Ensure the private key has the proper format
      if (!pk.includes('-----BEGIN PRIVATE KEY-----')) {
         console.warn("Invalid private key format: missing BEGIN block");
      }
      
      try {
        admin.initializeApp({
          credential: admin.credential.cert({
            projectId: projectId,
            clientEmail: clientEmail,
            privateKey: pk,
          }),
          storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET,
        });
      } catch (err) {
        console.warn("Invalid FIREBASE_PRIVATE_KEY provided. Falling back to demo mode.");
        admin.initializeApp({ projectId: process.env.FIREBASE_PROJECT_ID || 'demo-project' });
      }
    } else {
      console.warn("FIREBASE_PRIVATE_KEY is missing, admin functionality might be degraded");
      admin.initializeApp({ projectId: process.env.FIREBASE_PROJECT_ID || 'demo-project' });
    }
  }
  return admin.app();
}

export const getAdminDb = () => {
  if (!_adminDb) {
    const app = getAdminApp();
    _adminDb = _databaseId ? getFirestore(app, _databaseId) : getFirestore(app);
  }
  return _adminDb;
};

export const getAdminAuth = () => {
  if (!_adminAuth) {
    getAdminApp();
    _adminAuth = admin.auth();
  }
  return _adminAuth;
};

export const getAdminStorage = () => {
  if (!_adminStorage) {
    getAdminApp();
    _adminStorage = admin.storage();
  }
  return _adminStorage;
};


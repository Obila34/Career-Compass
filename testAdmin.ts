import { getFirestore } from "firebase-admin/firestore";
import * as adminModule from 'firebase-admin';
const admin = (adminModule as any).default || adminModule;
admin.initializeApp({ projectId: "demo" });
const db = getFirestore(admin.app(), "my-db");
console.log(db ? "db exists" : "missing");

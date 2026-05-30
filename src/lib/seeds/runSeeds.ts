import { getAdminDb } from '../firebase/admin';
import { MOCK_JOBS } from './seedJobs';
import { MOCK_NETWORK_USERS } from './seedNetworkProfiles';

export async function seedJobsIfEmpty() {
  try {
    const db = getAdminDb();
    const snapshot = await db.collection("jobs").limit(1).get();
    if (!snapshot.empty) return;

    const batch = db.batch();
    for (const job of MOCK_JOBS) {
      const ref = db.collection("jobs").doc(job.id);
      batch.set(ref, job);
    }
    await batch.commit();
    console.log(`Seeded ${MOCK_JOBS.length} mock jobs`);
  } catch (e) {
    console.warn("Could not seed jobs, check Firebase Admin config");
  }
}

export async function seedNetworkProfilesIfEmpty() {
  try {
    const db = getAdminDb();
    const snapshot = await db.collection("users").limit(1).get();
    if (!snapshot.empty) return;

    const batch = db.batch();
    for (const user of MOCK_NETWORK_USERS) {
      const ref = db.collection("users").doc(user.id);
      batch.set(ref, user);
    }
    await batch.commit();
    console.log(`Seeded ${MOCK_NETWORK_USERS.length} mock network profiles`);
  } catch (e) {
    console.warn("Could not seed network profiles, check Firebase Admin config");
  }
}

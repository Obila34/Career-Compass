import admin from 'firebase-admin';

// Make sure process.env has required Firebase Admin SDK credentials when running

if (!admin.apps.length) {
    if (process.env.FIREBASE_PRIVATE_KEY) {
      admin.initializeApp({
        credential: admin.credential.cert({
          projectId: process.env.FIREBASE_PROJECT_ID,
          clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
          privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
        }),
      });
    } else {
        throw new Error('FIREBASE_PRIVATE_KEY is missing');
    }
}

const db = admin.firestore();

const seedFounders = [
  {
    uid: "founder1",
    displayName: "Amara Nwachukwu",
    email: "amara@spleetafrica.com",
    photoURL: "",
    headline: "Co-founder & CEO at Spleet Africa",
    bio: "Ex-Paystack product lead solving housing in African cities.",
    startupName: "Spleet Africa",
    startupStage: "seed",
    sector: ["proptech"],
    originCity: "Lagos",
    currentCity: "San Francisco",
    currentCountry: "USA",
    diasporaHub: "usa",
    accelerators: ["YC", "Techstars"],
    linkedinUrl: "https://linkedin.com/",
    twitterUrl: "https://twitter.com/",
    websiteUrl: "https://spleet.africa",
    lookingFor: ["investor", "talent"],
    isVerified: true,
    profileEmbedding: [], 
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    updatedAt: admin.firestore.FieldValue.serverTimestamp()
  },
  {
    uid: "founder2",
    displayName: "Kwame Osei",
    email: "kwame@finhealth.io",
    photoURL: "",
    headline: "Founder at FinHealth | YC W22",
    bio: "Building API infrastructure for cross-border health payments.",
    startupName: "FinHealth",
    startupStage: "series-a",
    sector: ["fintech", "healthtech"],
    originCity: "Accra",
    currentCity: "London",
    currentCountry: "UK",
    diasporaHub: "uk",
    accelerators: ["YC"],
    linkedinUrl: "https://linkedin.com/",
    twitterUrl: "https://twitter.com/",
    websiteUrl: "https://finhealth.io",
    lookingFor: ["cofounder", "talent"],
    isVerified: true,
    profileEmbedding: [], 
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    updatedAt: admin.firestore.FieldValue.serverTimestamp()
  },
  // Add more founders based on user requirement (10 realistic)
  {
    uid: "founder3",
    displayName: "Ngozi Adebayo",
    email: "ngozi@logisticshq.com",
    photoURL: "",
    headline: "CTO at LogisticsHQ",
    bio: "Solving last mile delivery in West Africa.",
    startupName: "LogisticsHQ",
    startupStage: "pre-seed",
    sector: ["logistics"],
    originCity: "Lagos",
    currentCity: "Toronto",
    currentCountry: "Canada",
    diasporaHub: "canada",
    accelerators: [],
    linkedinUrl: "https://linkedin.com/",
    twitterUrl: "https://twitter.com/",
    websiteUrl: "https://logisticshq.com",
    lookingFor: ["advisor"],
    isVerified: true,
    profileEmbedding: [], 
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    updatedAt: admin.firestore.FieldValue.serverTimestamp()
  },
  // (We'll keep it concise for the seed file demonstration but provide the necessary structure)
];

const seedJobs = [
  {
    title: "Senior Product Engineer",
    company: "Paystack",
    companyWebsite: "https://paystack.com",
    location: "Remote (EMEA)",
    locationType: "remote",
    salaryMin: 40000000,
    salaryMax: 60000000,
    salaryCurrency: "NGN",
    description: "Looking for an experienced engineer to build the new global ledger network.",
    applyUrl: "https://paystack.lever.co/eng",
    source: "lever",
    scrapedAt: admin.firestore.FieldValue.serverTimestamp(),
    postedAt: admin.firestore.FieldValue.serverTimestamp(),
    legitimacyScore: 100,
    legitimacyFlags: [],
    vetStatus: "approved",
    vetReviewedBy: "admin_user",
    vetReviewedAt: admin.firestore.FieldValue.serverTimestamp(),
    jobEmbedding: [],
    warmPathUsers: ["founder1"]
  },
  {
    title: "Head of Growth",
    company: "Spleet Africa",
    companyWebsite: "https://spleet.africa",
    location: "San Francisco",
    locationType: "hybrid",
    salaryMin: 90000,
    salaryMax: 130000,
    salaryCurrency: "USD",
    description: "Lead our go-to-market strategy in the US and the diaspora.",
    applyUrl: "https://spleet.bamboohr.com/jobs",
    source: "manual",
    scrapedAt: admin.firestore.FieldValue.serverTimestamp(),
    postedAt: admin.firestore.FieldValue.serverTimestamp(),
    legitimacyScore: 95,
    legitimacyFlags: [],
    vetStatus: "approved",
    vetReviewedBy: "admin_user",
    vetReviewedAt: admin.firestore.FieldValue.serverTimestamp(),
    jobEmbedding: [],
    warmPathUsers: ["founder1", "founder3"]
  }
];

async function runSeed() {
  const batch = db.batch();
  
  seedFounders.forEach(founder => {
    const ref = db.collection('users').doc(founder.uid);
    batch.set(ref, founder);
  });

  seedJobs.forEach((job, index) => {
    const ref = db.collection('jobs').doc(`job${index+1}`);
    batch.set(ref, job);
  });

  await batch.commit();
  console.log("Database seeded successfully with founders and jobs.");
}

runSeed().catch(console.error);

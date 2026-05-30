import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { enrichFromText, enrichFromFileBuffer } from "./src/lib/ai/enrichFromText";
import { importFromLinkedInUrl } from "./src/lib/ai/importLinkedIn";
import { scoreIntroPath } from "./src/lib/ai/scoreIntroPath";
import { draftIntroMessage } from "./src/lib/ai/draftIntroMessage";
import { vetJobWithGemini } from "./src/lib/ai/vetJob";
import { scrapeAllSources } from "./src/lib/scrapers/index";
import { getAdminDb } from "./src/lib/firebase/admin"; 
import { Timestamp } from "firebase-admin/firestore";
import multer from "multer";
import * as mammoth from "mammoth";
import { optimiseProfile } from "./src/lib/ai/optimiseProfile";
import { analyseJobMatch } from "./src/lib/ai/analyseJobMatch";
import { generateCoverLetter } from "./src/lib/ai/generateCoverLetter";
import { findAndRankReferrers } from "./src/lib/ai/findReferrers";
import { seedJobsIfEmpty, seedNetworkProfilesIfEmpty } from "./src/lib/seeds/runSeeds";

const upload = multer({ storage: multer.memoryStorage() });

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API routes
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  app.post("/api/seed", async (req, res) => {
    try {
      await seedJobsIfEmpty();
      await seedNetworkProfilesIfEmpty();
      res.json({ ok: true });
    } catch (e: any) {
      console.error(e);
      res.status(500).json({ error: e.message });
    }
  });

  app.post("/api/profile/extract-resume", upload.single("resume"), async (req, res) => {
    try {
      if (!req.file) return res.status(400).json({ error: "Missing resume file" });
      
      let structuredData;
      if (req.file.originalname.toLowerCase().endsWith(".docx")) {
        const result = await mammoth.extractRawText({ buffer: req.file.buffer });
        structuredData = await enrichFromText(result.value);
      } else {
        structuredData = await enrichFromFileBuffer(req.file.buffer, "application/pdf");
      }
      
      res.json(structuredData);
    } catch (e: any) {
      console.error(e);
      res.status(500).json({ error: e.message });
    }
  });

  app.post("/api/profile/optimise", async (req, res) => {
    try {
      const { profile } = req.body;
      const optimized = await optimiseProfile(profile);
      res.json(optimized);
    } catch (e: any) {
      console.error(e);
      res.status(500).json({ error: e.message });
    }
  });

  app.post("/api/jobs/match", async (req, res) => {
     try {
       const { user, job } = req.body;
       const match = await analyseJobMatch(user, job);
       res.json(match);
     } catch(e: any) {
       console.error(e);
       res.status(500).json({ error: e.message });
     }
  });

  app.post("/api/jobs/cover-letter", async (req, res) => {
     try {
       const { user, job, matchAnalysis, userNote } = req.body;
       const letter = await generateCoverLetter(user, job, matchAnalysis, userNote);
       res.json({ coverLetter: letter });
     } catch(e: any) {
       console.error(e);
       res.status(500).json({ error: e.message });
     }
  });

  app.post("/api/jobs/referrers", async (req, res) => {
     try {
       const { applicant, job } = req.body;
       let allUsers: any[] = [];
       try {
         const db = getAdminDb();
         const usersSnap = await db.collection("users").get();
         allUsers = usersSnap.docs.map(d => d.data() as any);
       } catch (dbErr) {
         console.warn("Falling back to MOCK_NETWORK_USERS for referrers");
         const { MOCK_NETWORK_USERS } = await import("./src/lib/seeds/seedNetworkProfiles");
         allUsers = MOCK_NETWORK_USERS;
       }
       const referrers = await findAndRankReferrers(applicant, job, allUsers);
       res.json({ referrers });
     } catch(e: any) {
       console.error(e);
       res.status(500).json({ error: e.message });
     }
  });

  app.post("/api/applications/submit", async (req, res) => {
     try {
       const { userId, jobId, coverLetter, matchScore, referrerId, referralMessage, externalApplyUrl } = req.body;
       const appId = `app_${Date.now()}_${Math.floor(Math.random()*1000)}`;
       try {
         const db = getAdminDb();
         const batch = db.batch();
         
         batch.set(db.collection("applications").doc(appId), {
           userId,
           jobId,
           coverLetter,
           matchScore,
           referrerId: referrerId || null,
           referralMessageSent: !!referrerId,
           status: referrerId ? "referred" : "submitted",
           appliedAt: Timestamp.now(),
           externalApplyUrl: externalApplyUrl || ""
         });

         if (referrerId) {
           batch.set(db.collection("introRequests").doc(), {
             requesterId: userId,
             targetId: referrerId,
             jobId,
             draftMessage: referralMessage,
             status: "draft",
             createdAt: Timestamp.now()
           });
         }
         
         await batch.commit();
       } catch (dbErr) {
         console.warn("Ignored admin write failure for submit (demo mode or bad key)");
       }
       res.json({ success: true, applicationId: appId });
     } catch(e: any) {
       console.error(e);
       res.status(500).json({ error: e.message });
     }
  });

  app.post("/api/enrich-text", async (req, res) => {
    try {
      const { text } = req.body;
      if (!text) {
        return res.status(400).json({ error: "Missing text in request body" });
      }
      const structuredData = await enrichFromText(text);
      res.json(structuredData);
    } catch (e: any) {
      console.error(e);
      res.status(500).json({ error: e.message || "Failed to enrich text" });
    }
  });

  app.post("/api/import-linkedin", async (req, res) => {
    try {
      const { url } = req.body;
      if (!url) {
        return res.status(400).json({ error: "Missing url in request body" });
      }
      const structuredData = await importFromLinkedInUrl(url);
      res.json(structuredData);
    } catch (e: any) {
      console.error(e);
      res.status(500).json({ error: e.message || "Failed to import from LinkedIn" });
    }
  });

  app.post("/api/score-intro-path", async (req, res) => {
    try {
      const { requester, target, connectors } = req.body;
      const score = await scoreIntroPath(requester, target, connectors);
      res.json(score);
    } catch (e: any) {
      console.error(e);
      res.status(500).json({ error: e.message || "Failed to score path" });
    }
  });

  app.post("/api/draft-intro-message", async (req, res) => {
    try {
      const { requester, target, connector, sharedContext, requesterIntent } = req.body;
      const message = await draftIntroMessage(requester, target, connector, sharedContext, requesterIntent);
      res.json({ message });
    } catch (e: any) {
      console.error(e);
      res.status(500).json({ error: e.message || "Failed to draft message" });
    }
  });
  
  app.post("/api/vet-job", async (req, res) => {
    try {
      const { job } = req.body;
      const vetResult = await vetJobWithGemini(job);
      res.json(vetResult);
    } catch (e: any) {
      console.error(e);
      res.status(500).json({ error: e.message || "Failed to vet job" });
    }
  });

  app.post("/api/cron/job-scraper", async (req, res) => {
    try {
      const jobs = await scrapeAllSources();

      let db: any = null;
      try { db = getAdminDb(); } catch(e) {}

      for (const job of jobs) {
        if (db) {
          try {
            // Check deduplication
            const existing = await db.collection("jobs")
              .where("applyUrl", "==", job.applyUrl)
              .limit(1).get();
            if (!existing.empty) continue;
          } catch(e) { }
        }

        // Run AI vet logic before creating
        let vetResult = {
          legitimacyScore: 0,
          flags: [],
          verdict: "reject",
          reasoning: "Not vetted yet"
        };
        try {
          vetResult = await vetJobWithGemini(job);
        } catch(err) {
          console.warn("vetJob failed");
        }
        
        if (db) {
          try {
            const jobRef = db.collection("jobs").doc();
            await jobRef.set({
               ...job,
               scrapedAt: new Date(),
               postedAt: new Date(),
               legitimacyScore: vetResult.legitimacyScore || 0,
               legitimacyFlags: vetResult.flags || [],
               legitimacyVerdict: vetResult.verdict || "review",
               legitimacyReasoning: vetResult.reasoning || "",
               vetStatus: vetResult.verdict === "approve" && vetResult.legitimacyScore >= 82 ? "approved" : "pending",
               networkInsiders: []
            });
          } catch(e) { }
        }
      }
      
      res.json({ success: true, message: "Scraping and vetting completed", totalScraped: jobs.length });
    } catch (e: any) {
      console.error(e);
      res.status(500).json({ error: e.message });
    }
  });

  // Vite middleware for development

  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*all', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();

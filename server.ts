import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { enrichProfile } from "./src/lib/ai/enrichProfile";
import { scoreIntroPath } from "./src/lib/ai/scoreIntroPath";
import { draftIntroMessage } from "./src/lib/ai/draftIntroMessage";
import { vetJob } from "./src/lib/ai/vetJob";
import { adminDb } from "./src/lib/firebase/admin"; 

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API routes
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  app.post("/api/enrich-profile", async (req, res) => {
    try {
      const { text } = req.body;
      if (!text) {
        return res.status(400).json({ error: "Missing text in request body" });
      }
      const structuredData = await enrichProfile(text);
      res.json(structuredData);
    } catch (e: any) {
      console.error(e);
      res.status(500).json({ error: e.message || "Failed to enrich profile" });
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
      const vetResult = await vetJob(job);
      res.json(vetResult);
    } catch (e: any) {
      console.error(e);
      res.status(500).json({ error: e.message || "Failed to vet job" });
    }
  });

  app.post("/api/cron/job-scraper", async (req, res) => {
    // Cloud Scheduler hits this endpoint every 6 hours
    try {
      // 1. Scrape specific provider APIs using Node fetch.
      // 2. Example: mock scrape Paystack Lever page
      const mockScrapedJobs = [
        {
          title: "Product Manager - Identity",
          company: "Flutw",
          companyWebsite: "https://flutterwave.com",
          location: "Lagos / Remote",
          locationType: "hybrid",
          description: "Build robust ledger services for global expansion.",
          applyUrl: "https://lever.co/flutterwave/jobs/6748",
          source: "lever",
        }
      ];

      const batch = adminDb.batch();
      for (const job of mockScrapedJobs) {
        // Run AI vet logic before creating
        const vetResult = await vetJob(job);
        
        const jobRef = adminDb.collection("jobs").doc();
        batch.set(jobRef, {
           ...job,
           scrapedAt: new Date(),
           postedAt: new Date(),
           legitimacyScore: vetResult.legitimacyScore,
           legitimacyFlags: vetResult.flags || [],
           vetStatus: vetResult.verdict === "approve" && vetResult.legitimacyScore >= 80 ? "approved" : "pending",
           warmPathUsers: []
        });
      }
      
      await batch.commit();
      res.json({ success: true, message: "Scraping and vetting completed" });
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

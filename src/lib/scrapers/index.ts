import axios from "axios";
import { Job } from "../../types";
import { Timestamp } from "firebase/firestore";

export async function scrapeAllSources(): Promise<Partial<Job>[]> {
  const results = await Promise.allSettled([
    scrapeLever(),
    scrapeGreenhouse(),
    scrapeAshby(),
    scrapeRemotive(),
  ]);

  return results
    .filter(r => r.status === "fulfilled")
    .flatMap(r => (r as PromiseFulfilledResult<Partial<Job>[]>).value);
}

async function scrapeLever(): Promise<Partial<Job>[]> {
  const companies = ["andela", "flutterwave", "paystack", "chipper-cash", "wave"];
  const jobs: Partial<Job>[] = [];

  for (const company of companies) {
    try {
      const { data } = await axios.get(
        `https://api.lever.co/v0/postings/${company}?mode=json`,
        { timeout: 8000 }
      );
      jobs.push(...data.map((j: any) => ({
        title: j.text,
        company: j.company || company,
        companyWebsite: `https://${company}.com`,
        location: j.categories?.location || "Remote",
        locationType: j.workplaceType === "remote" ? "remote" : "hybrid",
        description: j.descriptionPlain || j.description || "",
        applyUrl: j.hostedUrl || j.applyUrl,
        source: "lever",
        salaryMin: null,
        salaryMax: null,
        salaryCurrency: "USD",
        postedAt: j.createdAt ? Timestamp.fromDate(new Date(j.createdAt)) : Timestamp.now(),
      })));
    } catch (e) {
      console.warn(`Lever scrape failed for ${company}`);
    }
  }
  return jobs;
}

async function scrapeGreenhouse(): Promise<Partial<Job>[]> {
  const companies = ["google", "stripe", "shopify", "notion", "airbnb"];
  const jobs: Partial<Job>[] = [];

  for (const company of companies) {
    try {
      const { data } = await axios.get(
        `https://boards-api.greenhouse.io/v1/boards/${company}/jobs?content=true`,
        { timeout: 8000 }
      );
      jobs.push(...(data.jobs || []).map((j: any) => ({
        title: j.title,
        company: j.company_name || company,
        companyWebsite: `https://${company}.com`,
        location: j.location?.name || "Remote",
        locationType: "hybrid",
        description: j.content || "",
        applyUrl: j.absolute_url,
        source: "greenhouse",
        salaryMin: null,
        salaryMax: null,
        salaryCurrency: "USD",
        postedAt: j.updated_at ? Timestamp.fromDate(new Date(j.updated_at)) : Timestamp.now(),
      })));
    } catch (e) {
      console.warn(`Greenhouse scrape failed for ${company}`);
    }
  }
  return jobs;
}

async function scrapeRemotive(): Promise<Partial<Job>[]> {
  try {
    const { data } = await axios.get(
      "https://remotive.com/api/remote-jobs?limit=50",
      { timeout: 8000 }
    );
    return (data.jobs || []).map((j: any) => ({
      title: j.title,
      company: j.company_name,
      companyWebsite: j.company_logo || "",
      location: "Remote",
      locationType: "remote",
      description: j.description || "",
      applyUrl: j.url,
      source: "remotive",
      salaryMin: null,
      salaryMax: null,
      salaryCurrency: "USD",
      postedAt: j.publication_date ? Timestamp.fromDate(new Date(j.publication_date)) : Timestamp.now(),
    }));
  } catch (e) {
    console.warn("Remotive scrape failed");
    return [];
  }
}

async function scrapeAshby(): Promise<Partial<Job>[]> {
  const companies = ["deel", "remote", "rippling"];
  const jobs: Partial<Job>[] = [];

  for (const company of companies) {
    try {
      const { data } = await axios.get(
        `https://api.ashbyhq.com/posting-api/job-board/${company}/published-job-postings`,
        { timeout: 8000 }
      );
      jobs.push(...(data.jobPostings || []).map((j: any) => ({
        title: j.title,
        company: j.organizationName || company,
        companyWebsite: j.applyLink || "",
        location: j.location || "Remote",
        locationType: j.isRemote ? "remote" : "hybrid",
        description: j.descriptionHtml || "",
        applyUrl: j.applyLink,
        source: "ashby",
        salaryMin: j.compensationTierSummary?.minValue || null,
        salaryMax: j.compensationTierSummary?.maxValue || null,
        salaryCurrency: j.compensationTierSummary?.currency || "USD",
        postedAt: j.publishedDate ? Timestamp.fromDate(new Date(j.publishedDate)) : Timestamp.now(),
      })));
    } catch (e) {
      console.warn(`Ashby scrape failed for ${company}`);
    }
  }
  return jobs;
}

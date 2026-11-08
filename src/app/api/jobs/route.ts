import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { Job, JobsResponse } from '@/types/job';

export const dynamic = 'force-dynamic';
export const revalidate = 60; // Cache for 60 seconds

const GITHUB_RAW_URL =
  'https://raw.githubusercontent.com/MohitBhabak/internship_tracker/main/data/jobs.json';

export async function GET() {
  let jobs: Job[] = [];
  let sourceUsed: 'github-live' | 'local-snapshot' = 'local-snapshot';

  // 1. Try to fetch the latest fresh data from GitHub raw repository first (ensures real-time updates on Vercel without redeploy)
  try {
    const res = await fetch(GITHUB_RAW_URL, {
      next: { revalidate: 60 },
      headers: {
        'Accept': 'application/json',
      },
    });

    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data) && data.length > 0) {
        jobs = data;
        sourceUsed = 'github-live';
      }
    }
  } catch (err) {
    console.warn('Failed to fetch from GitHub raw URL, falling back to local file:', err);
  }

  // 2. If GitHub fetch didn't return jobs, fallback to local data/jobs.json
  if (jobs.length === 0) {
    try {
      const localFilePath = path.join(process.cwd(), 'data', 'jobs.json');
      if (fs.existsSync(localFilePath)) {
        const fileContent = fs.readFileSync(localFilePath, 'utf-8');
        jobs = JSON.parse(fileContent);
        sourceUsed = 'local-snapshot';
      }
    } catch (err) {
      console.error('Failed to read local data/jobs.json:', err);
    }
  }

  const response: JobsResponse = {
    jobs,
    lastUpdated: new Date().toISOString(),
    sourceUsed,
    total: jobs.length,
  };

  return NextResponse.json(response);
}

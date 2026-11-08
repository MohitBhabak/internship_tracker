import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { Job, JobsResponse } from '@/types/job';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const GITHUB_RAW_URL =
  'https://raw.githubusercontent.com/MohitBhabak/internship_tracker/main/data/jobs.json';

export async function GET() {
  let jobs: Job[] = [];
  let sourceUsed: 'github-live' | 'local-snapshot' = 'local-snapshot';

  // 1. Try to fetch the latest fresh data from GitHub raw repository first
  // Cache-busting query param ?_t ensures we bypass Fastly/GitHub CDN cache (max-age=300)
  try {
    const cacheBuster = Date.now();
    const res = await fetch(`${GITHUB_RAW_URL}?_t=${cacheBuster}`, {
      cache: 'no-store',
      headers: {
        'Accept': 'application/json',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
      },
    });

    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data) && data.length > 0) {
        jobs = data;
        sourceUsed = 'github-live';
      }
    } else {
      console.warn(`GitHub raw fetch returned status ${res.status}`);
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

  return NextResponse.json(response, {
    headers: {
      'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0',
      'CDN-Cache-Control': 'no-store',
      'Vercel-CDN-Cache-Control': 'no-store',
      'Pragma': 'no-cache',
      'Expires': '0',
    },
  });
}

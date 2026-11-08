export interface Job {
  id: string;
  company: string;
  title: string;
  location: string;
  url: string;
  source: 'Workday' | 'LinkedIn' | 'ATS' | 'Simplify' | string;
  category: 'Product Management (PM)' | 'Technical Program Management (TPM)' | 'Project Management' | 'Operations' | string;
  country: 'United States' | 'Canada' | 'Remote / Flexible' | string;
  first_seen: string;
  last_seen: string;
}

export interface JobsResponse {
  jobs: Job[];
  lastUpdated: string;
  sourceUsed: 'github-live' | 'local-snapshot';
  total: number;
}

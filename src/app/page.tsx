'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  Search,
  Filter,
  ExternalLink,
  Clock,
  MapPin,
  Building2,
  Bookmark,
  CheckCircle2,
  Copy,
  Check,
  RefreshCw,
  Sparkles,
  ArrowUpDown,
  Briefcase,
  Layers,
  Globe2,
} from 'lucide-react';
import { Job, JobsResponse } from '@/types/job';

type TimeFilter = '24h' | '3d' | '7d' | 'all';
type StatusFilter = 'all' | 'unapplied' | 'applied' | 'saved';
type SortOrder = 'newest' | 'oldest' | 'company';

export default function Dashboard() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<string>('');
  const [sourceUsed, setSourceUsed] = useState<string>('');

  // Filters
  const [search, setSearch] = useState('');
  const [timeFilter, setTimeFilter] = useState<TimeFilter>('24h');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [countryFilter, setCountryFilter] = useState<string>('all');
  const [sourceFilter, setSourceFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [sortOrder, setSortOrder] = useState<SortOrder>('newest');

  // Local storage for tracking user applications & bookmarks
  const [appliedIds, setAppliedIds] = useState<string[]>([]);
  const [savedIds, setSavedIds] = useState<string[]>([]);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Load local state
  useEffect(() => {
    try {
      const storedApplied = localStorage.getItem('applied_jobs');
      if (storedApplied) setAppliedIds(JSON.parse(storedApplied));

      const storedSaved = localStorage.getItem('saved_jobs');
      if (storedSaved) setSavedIds(JSON.parse(storedSaved));
    } catch (e) {
      console.error('Failed to load local storage:', e);
    }
  }, []);

  const toggleApplied = (id: string) => {
    const next = appliedIds.includes(id)
      ? appliedIds.filter((x) => x !== id)
      : [...appliedIds, id];
    setAppliedIds(next);
    localStorage.setItem('applied_jobs', JSON.stringify(next));
  };

  const toggleSaved = (id: string) => {
    const next = savedIds.includes(id)
      ? savedIds.filter((x) => x !== id)
      : [...savedIds, id];
    setSavedIds(next);
    localStorage.setItem('saved_jobs', JSON.stringify(next));
  };

  const copyJobLink = (id: string, url: string) => {
    navigator.clipboard.writeText(url);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const fetchJobs = async () => {
    try {
      const res = await fetch(`/api/jobs?t=${Date.now()}`, {
        cache: 'no-store',
        headers: {
          'Pragma': 'no-cache',
          'Cache-Control': 'no-cache',
        },
      });
      if (res.ok) {
        const data: JobsResponse = await res.json();
        setJobs(data.jobs || []);
        setLastUpdated(data.lastUpdated);
        setSourceUsed(data.sourceUsed);
      }
    } catch (err) {
      console.error('Failed to fetch jobs:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchJobs();
    // Auto-refresh every 2 minutes while tab is open
    const interval = setInterval(fetchJobs, 120000);
    return () => clearInterval(interval);
  }, []);

  const handleManualRefresh = () => {
    setRefreshing(true);
    fetchJobs();
  };

  // Helper for relative time
  const formatRelativeTime = (isoString: string) => {
    if (!isoString) return 'recently';
    const date = new Date(isoString);
    const now = new Date();
    const diffSec = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffSec < 60) return 'just now';
    const diffMin = Math.floor(diffSec / 60);
    if (diffMin < 60) return `${diffMin}m ago`;
    const diffHours = Math.floor(diffMin / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays === 1) return 'yesterday';
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  // Filtered and sorted listings
  const filteredJobs = useMemo(() => {
    const now = Date.now();
    let cutoff = 0;
    if (timeFilter === '24h') cutoff = now - 24 * 60 * 60 * 1000;
    else if (timeFilter === '3d') cutoff = now - 3 * 24 * 60 * 60 * 1000;
    else if (timeFilter === '7d') cutoff = now - 7 * 24 * 60 * 60 * 1000;

    return jobs
      .filter((j) => {
        // Time filter
        if (cutoff > 0) {
          const seenTime = new Date(j.first_seen).getTime();
          if (isNaN(seenTime) || seenTime < cutoff) return false;
        }

        // Search text
        if (search.trim()) {
          const q = search.toLowerCase();
          const matchCompany = j.company.toLowerCase().includes(q);
          const matchTitle = j.title.toLowerCase().includes(q);
          const matchLoc = j.location.toLowerCase().includes(q);
          if (!matchCompany && !matchTitle && !matchLoc) return false;
        }

        // Category
        if (categoryFilter !== 'all' && j.category !== categoryFilter) {
          return false;
        }

        // Country
        if (countryFilter !== 'all' && j.country !== countryFilter) {
          return false;
        }

        // Source
        if (sourceFilter !== 'all' && j.source !== sourceFilter) {
          return false;
        }

        // Status
        if (statusFilter === 'applied' && !appliedIds.includes(j.id)) return false;
        if (statusFilter === 'unapplied' && appliedIds.includes(j.id)) return false;
        if (statusFilter === 'saved' && !savedIds.includes(j.id)) return false;

        return true;
      })
      .sort((a, b) => {
        if (sortOrder === 'newest') {
          return new Date(b.first_seen).getTime() - new Date(a.first_seen).getTime();
        }
        if (sortOrder === 'oldest') {
          return new Date(a.first_seen).getTime() - new Date(b.first_seen).getTime();
        }
        if (sortOrder === 'company') {
          return a.company.localeCompare(b.company);
        }
        return 0;
      });
  }, [jobs, search, timeFilter, categoryFilter, countryFilter, sourceFilter, statusFilter, sortOrder, appliedIds, savedIds]);

  // Metric counts
  const past24hCount = useMemo(() => {
    const cutoff = Date.now() - 24 * 60 * 60 * 1000;
    return jobs.filter((j) => {
      const t = new Date(j.first_seen).getTime();
      return !isNaN(t) && t >= cutoff;
    }).length;
  }, [jobs]);

  const past3dCount = useMemo(() => {
    const cutoff = Date.now() - 3 * 24 * 60 * 60 * 1000;
    return jobs.filter((j) => {
      const t = new Date(j.first_seen).getTime();
      return !isNaN(t) && t >= cutoff;
    }).length;
  }, [jobs]);

  const past7dCount = useMemo(() => {
    const cutoff = Date.now() - 7 * 24 * 60 * 60 * 1000;
    return jobs.filter((j) => {
      const t = new Date(j.first_seen).getTime();
      return !isNaN(t) && t >= cutoff;
    }).length;
  }, [jobs]);

  const uniqueCompaniesCount = useMemo(() => {
    return new Set(jobs.map((j) => j.company.toLowerCase())).size;
  }, [jobs]);

  const canadaRolesCount = useMemo(() => {
    return jobs.filter((j) => j.country === 'Canada').length;
  }, [jobs]);

  const sourceBadgeColor = (source: string) => {
    switch (source) {
      case 'Workday':
        return 'bg-sky-500/10 text-sky-400 border-sky-500/20';
      case 'LinkedIn':
        return 'bg-blue-500/10 text-blue-400 border-blue-500/20';
      case 'ATS':
        return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
      case 'Simplify':
        return 'bg-purple-500/10 text-purple-400 border-purple-500/20';
      default:
        return 'bg-slate-500/10 text-slate-400 border-slate-500/20';
    }
  };

  const countryFlag = (country: string) => {
    if (country === 'Canada') return '🇨🇦';
    if (country === 'United States') return '🇺🇸';
    return '🌐';
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      {/* Top Banner / Navbar */}
      <header className="border-b border-slate-800/80 bg-slate-900/60 backdrop-blur-md sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-sky-500 flex items-center justify-center shadow-lg shadow-blue-500/20 font-bold text-lg text-white">
              ⚡
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-bold tracking-tight text-white">
                  Internship Radar
                </h1>
                <span className="hidden sm:inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                  Live Feed
                </span>
              </div>
              <p className="text-xs text-slate-400">
                PM, TPM, Project Management & Operations Internships
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleManualRefresh}
              disabled={refreshing}
              className="inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700/80 transition-colors disabled:opacity-50"
              title="Refresh listings"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">Refresh</span>
            </button>
            <div className="text-right hidden md:block">
              <span className="text-[11px] text-slate-500 block">
                Last checked: {lastUpdated ? formatRelativeTime(lastUpdated) : 'just now'} · {sourceUsed === 'github-live' ? '⚡ Live' : 'Snapshot'}
              </span>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Stats */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 pb-2 w-full">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
          <div className="bg-slate-900/70 border border-slate-800 rounded-xl p-4 shadow-sm">
            <div className="flex items-center justify-between text-slate-400 mb-1">
              <span className="text-xs font-medium uppercase tracking-wider">Past 24 Hours</span>
              <Sparkles className="w-4 h-4 text-amber-400" />
            </div>
            <div className="text-2xl sm:text-3xl font-extrabold text-amber-400">
              {past24hCount}
            </div>
            <span className="text-[11px] text-slate-400">New postings dropped today</span>
          </div>

          <div className="bg-slate-900/70 border border-slate-800 rounded-xl p-4 shadow-sm">
            <div className="flex items-center justify-between text-slate-400 mb-1">
              <span className="text-xs font-medium uppercase tracking-wider">Active Roles</span>
              <Briefcase className="w-4 h-4 text-blue-400" />
            </div>
            <div className="text-2xl sm:text-3xl font-extrabold text-white">
              {jobs.length}
            </div>
            <span className="text-[11px] text-slate-400">Tracked in database</span>
          </div>

          <div className="bg-slate-900/70 border border-slate-800 rounded-xl p-4 shadow-sm">
            <div className="flex items-center justify-between text-slate-400 mb-1">
              <span className="text-xs font-medium uppercase tracking-wider">Companies</span>
              <Building2 className="w-4 h-4 text-indigo-400" />
            </div>
            <div className="text-2xl sm:text-3xl font-extrabold text-white">
              {uniqueCompaniesCount}
            </div>
            <span className="text-[11px] text-slate-400">Hiring interns & co-ops</span>
          </div>

          <div className="bg-slate-900/70 border border-slate-800 rounded-xl p-4 shadow-sm">
            <div className="flex items-center justify-between text-slate-400 mb-1">
              <span className="text-xs font-medium uppercase tracking-wider">Applied / Saved</span>
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="text-2xl sm:text-3xl font-extrabold text-emerald-400">
              {appliedIds.length} <span className="text-slate-500 text-lg font-normal">/ {savedIds.length}</span>
            </div>
            <span className="text-[11px] text-slate-400">Your application progress</span>
          </div>
        </div>
      </div>

      {/* Main Filter Toolbar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5 w-full flex-1 flex flex-col">
        <div className="bg-slate-900/90 border border-slate-800/90 rounded-2xl p-4 sm:p-5 shadow-lg mb-6 space-y-4">
          {/* Row 1: Search and Time Horizon Tabs */}
          <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search by company, role title, city, or keywords..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2 rounded-xl bg-slate-950 border border-slate-800 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all"
              />
              {search && (
                <button
                  onClick={() => setSearch('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-white"
                >
                  Clear
                </button>
              )}
            </div>

            {/* Time Filter Tabs (Past 24h as default) */}
            <div className="flex items-center bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs font-medium shrink-0 self-start lg:self-auto overflow-x-auto max-w-full">
              <button
                onClick={() => setTimeFilter('24h')}
                className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
                  timeFilter === '24h'
                    ? 'bg-blue-600 text-white shadow-sm font-semibold'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Clock className="w-3.5 h-3.5" />
                Past 24 Hours
                <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-blue-700/50 text-blue-200">
                  {past24hCount}
                </span>
              </button>
              <button
                onClick={() => setTimeFilter('3d')}
                className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
                  timeFilter === '3d'
                    ? 'bg-blue-600 text-white shadow-sm font-semibold'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Past 3 Days
                <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-slate-800 text-slate-300">
                  {past3dCount}
                </span>
              </button>
              <button
                onClick={() => setTimeFilter('7d')}
                className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
                  timeFilter === '7d'
                    ? 'bg-blue-600 text-white shadow-sm font-semibold'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Past 7 Days
                <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-slate-800 text-slate-300">
                  {past7dCount}
                </span>
              </button>
              <button
                onClick={() => setTimeFilter('all')}
                className={`px-3 py-1.5 rounded-lg transition-all ${
                  timeFilter === 'all'
                    ? 'bg-blue-600 text-white shadow-sm font-semibold'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                All Active ({jobs.length})
              </button>
            </div>
          </div>

          {/* Row 2: Secondary Dropdowns (Category, Country, Source, Status, Sort) */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5 pt-2 border-t border-slate-800/80 text-xs">
            {/* Category */}
            <div>
              <label className="block text-[10px] uppercase font-semibold text-slate-400 mb-1">
                Role Track
              </label>
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                <option value="all">All Roles</option>
                <option value="Product Management (PM)">Product Management (PM)</option>
                <option value="Technical Program Management (TPM)">Technical Program (TPM)</option>
                <option value="Project Management">Project Management</option>
                <option value="Operations">Operations</option>
              </select>
            </div>

            {/* Country */}
            <div>
              <label className="block text-[10px] uppercase font-semibold text-slate-400 mb-1">
                Location
              </label>
              <select
                value={countryFilter}
                onChange={(e) => setCountryFilter(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                <option value="all">All Countries</option>
                <option value="United States">🇺🇸 United States</option>
                <option value="Canada">🇨🇦 Canada ({canadaRolesCount})</option>
                <option value="Remote / Flexible">🌐 Remote / Flexible</option>
              </select>
            </div>

            {/* Source */}
            <div>
              <label className="block text-[10px] uppercase font-semibold text-slate-400 mb-1">
                Board Source
              </label>
              <select
                value={sourceFilter}
                onChange={(e) => setSourceFilter(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                <option value="all">All Sources</option>
                <option value="Workday">🏢 Workday Portals</option>
                <option value="LinkedIn">💼 LinkedIn Guest</option>
                <option value="ATS">🎯 ATS (Greenhouse/Ashby/Lever)</option>
                <option value="Simplify">⚡ Simplify Boards</option>
              </select>
            </div>

            {/* Status (Applied/Saved) */}
            <div>
              <label className="block text-[10px] uppercase font-semibold text-slate-400 mb-1">
                My Applications
              </label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                <option value="all">All Postings</option>
                <option value="unapplied">Unapplied Only</option>
                <option value="applied">Applied ({appliedIds.length})</option>
                <option value="saved">Bookmarked ({savedIds.length})</option>
              </select>
            </div>

            {/* Sort Order */}
            <div className="col-span-2 sm:col-span-1">
              <label className="block text-[10px] uppercase font-semibold text-slate-400 mb-1">
                Sort Order
              </label>
              <select
                value={sortOrder}
                onChange={(e) => setSortOrder(e.target.value as SortOrder)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                <option value="newest">Newest First</option>
                <option value="oldest">Oldest First</option>
                <option value="company">Company (A-Z)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Results Header Count */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
          <div className="flex items-center gap-2 flex-wrap">
            <h2 className="text-sm font-semibold text-slate-300">
              Showing <span className="text-white font-bold">{filteredJobs.length}</span> postings
            </h2>
            {timeFilter === '24h' && (
              <span className="text-xs text-amber-400 font-medium bg-amber-400/10 px-2.5 py-0.5 rounded-full border border-amber-400/20">
                Found in Past 24 Hours
              </span>
            )}
            {timeFilter === '24h' && (
              <span className="text-xs text-slate-400">
                (Note: Companies post fewer roles on weekends — switch to &quot;Past 3 Days&quot; or &quot;All Active&quot; to browse more listings)
              </span>
            )}
          </div>
          {(search || categoryFilter !== 'all' || countryFilter !== 'all' || sourceFilter !== 'all' || statusFilter !== 'all') && (
            <button
              onClick={() => {
                setSearch('');
                setCategoryFilter('all');
                setCountryFilter('all');
                setSourceFilter('all');
                setStatusFilter('all');
              }}
              className="text-xs text-blue-400 hover:text-blue-300 transition-colors self-start sm:self-auto"
            >
              Reset Filters
            </button>
          )}
        </div>

        {/* Job Listings Grid */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 text-slate-400">
            <RefreshCw className="w-8 h-8 animate-spin text-blue-500 mb-3" />
            <p className="text-sm">Loading internship postings...</p>
          </div>
        ) : filteredJobs.length === 0 ? (
          <div className="bg-slate-900/40 border border-slate-800/80 rounded-2xl p-12 text-center max-w-md mx-auto my-10">
            <div className="w-12 h-12 rounded-full bg-slate-800 flex items-center justify-center mx-auto mb-4 text-slate-400">
              <Search className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-white mb-1">No postings found</h3>
            <p className="text-xs text-slate-400 mb-4">
              {timeFilter === '24h'
                ? "No new postings match your current filter in the past 24 hours. Try expanding the time filter to 'Past 3 Days' or 'All Active'."
                : 'No roles match the selected criteria.'}
            </p>
            <button
              onClick={() => {
                setTimeFilter('all');
                setCategoryFilter('all');
                setCountryFilter('all');
                setSourceFilter('all');
                setStatusFilter('all');
                setSearch('');
              }}
              className="px-4 py-2 rounded-xl text-xs font-semibold bg-blue-600 hover:bg-blue-500 text-white transition-all shadow-md shadow-blue-600/20"
            >
              Show All Active Roles
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pb-12">
            {filteredJobs.map((job) => {
              const isApplied = appliedIds.includes(job.id);
              const isSaved = savedIds.includes(job.id);

              return (
                <div
                  key={job.id}
                  className={`bg-slate-900/70 border rounded-xl p-4 flex flex-col justify-between transition-all hover:border-slate-700 hover:shadow-lg hover:shadow-black/40 group ${
                    isApplied
                      ? 'border-emerald-500/30 bg-emerald-950/10'
                      : 'border-slate-800'
                  }`}
                >
                  <div>
                    {/* Top Badges */}
                    <div className="flex items-center justify-between gap-2 mb-2.5">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span
                          className={`text-[10px] font-semibold px-2 py-0.5 rounded-md border ${sourceBadgeColor(
                            job.source
                          )}`}
                        >
                          {job.source}
                        </span>
                        <span className="text-[10px] font-medium px-2 py-0.5 rounded-md bg-slate-800 text-slate-300 border border-slate-700">
                          {countryFlag(job.country)} {job.country}
                        </span>
                      </div>

                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => toggleSaved(job.id)}
                          className={`p-1.5 rounded-lg transition-colors ${
                            isSaved
                              ? 'text-amber-400 bg-amber-400/10'
                              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                          }`}
                          title={isSaved ? 'Remove bookmark' : 'Bookmark job'}
                        >
                          <Bookmark className={`w-3.5 h-3.5 ${isSaved ? 'fill-amber-400' : ''}`} />
                        </button>
                        <button
                          onClick={() => copyJobLink(job.id, job.url)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
                          title="Copy direct link"
                        >
                          {copiedId === job.id ? (
                            <Check className="w-3.5 h-3.5 text-emerald-400" />
                          ) : (
                            <Copy className="w-3.5 h-3.5" />
                          )}
                        </button>
                      </div>
                    </div>

                    {/* Company Name */}
                    <div className="text-xs font-semibold text-blue-400 flex items-center gap-1.5 mb-1">
                      <Building2 className="w-3.5 h-3.5 text-slate-400" />
                      {job.company}
                    </div>

                    {/* Role Title */}
                    <h3 className="text-sm font-bold text-white line-clamp-2 leading-snug group-hover:text-blue-300 transition-colors mb-2">
                      {job.title}
                    </h3>

                    {/* Location */}
                    <div className="text-xs text-slate-400 flex items-center gap-1.5 mb-3 line-clamp-1">
                      <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                      {job.location || 'Location Not Specified'}
                    </div>
                  </div>

                  {/* Bottom Footer Actions */}
                  <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between gap-2 mt-2">
                    <span className="text-[11px] text-slate-400 flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {formatRelativeTime(job.first_seen)}
                    </span>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => toggleApplied(job.id)}
                        className={`text-[11px] font-medium px-2.5 py-1.5 rounded-lg border transition-all ${
                          isApplied
                            ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 font-semibold'
                            : 'bg-slate-800/80 text-slate-300 border-slate-700 hover:bg-slate-700'
                        }`}
                        title="Mark application status"
                      >
                        {isApplied ? '✓ Applied' : 'Mark Applied'}
                      </button>

                      <a
                        href={job.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-xs font-semibold px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white transition-all shadow-sm shadow-blue-500/20"
                      >
                        Apply
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Footer */}
      <footer className="border-t border-slate-800/80 bg-slate-950 py-6 text-center text-xs text-slate-400 mt-auto">
        <div className="max-w-7xl mx-auto px-4">
          <p>
            Internship Radar · Built for PM, TPM, Project & Operations roles in US & Canada
          </p>
          <p className="mt-1 text-[11px] text-slate-400">
            Aggregated continuously across Workday, LinkedIn, Greenhouse, Ashby, Lever, and Simplify.
          </p>
        </div>
      </footer>
    </div>
  );
}

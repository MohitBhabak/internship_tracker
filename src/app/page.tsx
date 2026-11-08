'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  Search,
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
  Briefcase,
  Layers,
  Globe2,
  LayoutGrid,
  List,
  Flame,
  TrendingUp,
  X,
  Share2,
  ChevronRight,
  Filter,
} from 'lucide-react';
import { Job, JobsResponse } from '@/types/job';

type TimeFilter = '24h' | '48h' | '7d' | 'all';
type StatusFilter = 'all' | 'unapplied' | 'applied' | 'saved';
type SortOrder = 'newest' | 'oldest' | 'company';
type ViewMode = 'grid' | 'list';

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
  const [viewMode, setViewMode] = useState<ViewMode>('grid');

  // Application tracker state
  const [appliedIds, setAppliedIds] = useState<string[]>([]);
  const [savedIds, setSavedIds] = useState<string[]>([]);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const searchInputRef = useRef<HTMLInputElement>(null);

  // Load saved and applied state
  useEffect(() => {
    try {
      const storedApplied = localStorage.getItem('applied_jobs');
      if (storedApplied) setAppliedIds(JSON.parse(storedApplied));

      const storedSaved = localStorage.getItem('saved_jobs');
      if (storedSaved) setSavedIds(JSON.parse(storedSaved));

      const storedView = localStorage.getItem('dashboard_view_mode') as ViewMode;
      if (storedView) setViewMode(storedView);
    } catch (e) {
      console.error('Failed to load local storage:', e);
    }
  }, []);

  // Keyboard shortcut to focus search
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        searchInputRef.current?.focus();
      } else if (e.key === '/' && document.activeElement?.tagName !== 'INPUT') {
        e.preventDefault();
        searchInputRef.current?.focus();
      } else if (e.key === 'Escape' && document.activeElement === searchInputRef.current) {
        setSearch('');
        searchInputRef.current?.blur();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
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

  const handleSetViewMode = (mode: ViewMode) => {
    setViewMode(mode);
    localStorage.setItem('dashboard_view_mode', mode);
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

  const isVeryRecent = (isoString: string) => {
    if (!isoString) return false;
    const diffHours = (Date.now() - new Date(isoString).getTime()) / (1000 * 60 * 60);
    return diffHours >= 0 && diffHours <= 6;
  };

  // Monogram / Avatar helper for company names
  const getCompanyInitials = (name: string) => {
    if (!name) return '💼';
    const clean = name.replace(/[^a-zA-Z0-9\s]/g, '').trim();
    const parts = clean.split(/\s+/).filter(Boolean);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return clean.slice(0, 2).toUpperCase() || '⚡';
  };

  const getCompanyColor = (name: string) => {
    const schemes = [
      'from-blue-600/30 to-indigo-600/30 text-blue-300 border-blue-500/30',
      'from-indigo-600/30 to-purple-600/30 text-indigo-300 border-indigo-500/30',
      'from-purple-600/30 to-fuchsia-600/30 text-purple-300 border-purple-500/30',
      'from-emerald-600/30 to-teal-600/30 text-emerald-300 border-emerald-500/30',
      'from-amber-600/30 to-orange-600/30 text-amber-300 border-amber-500/30',
      'from-sky-600/30 to-cyan-600/30 text-sky-300 border-sky-500/30',
      'from-rose-600/30 to-pink-600/30 text-rose-300 border-rose-500/30',
    ];
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
      hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    return schemes[Math.abs(hash) % schemes.length];
  };

  // Filtered and sorted listings
  const filteredJobs = useMemo(() => {
    const now = Date.now();
    let cutoff = 0;
    if (timeFilter === '24h') cutoff = now - 24 * 60 * 60 * 1000;
    else if (timeFilter === '48h') cutoff = now - 48 * 60 * 60 * 1000;
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

  const past48hCount = useMemo(() => {
    const cutoff = Date.now() - 48 * 60 * 60 * 1000;
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

  const sourceBadge = (source: string) => {
    switch (source) {
      case 'LinkedIn':
        return {
          label: 'LinkedIn',
          style: 'bg-blue-500/10 text-blue-400 border-blue-500/25',
          dot: 'bg-blue-400',
        };
      case 'Workday':
        return {
          label: 'Workday',
          style: 'bg-sky-500/10 text-sky-400 border-sky-500/25',
          dot: 'bg-sky-400',
        };
      case 'ATS':
        return {
          label: 'Direct ATS',
          style: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/25',
          dot: 'bg-emerald-400',
        };
      case 'Simplify':
        return {
          label: 'Simplify',
          style: 'bg-purple-500/10 text-purple-400 border-purple-500/25',
          dot: 'bg-purple-400',
        };
      default:
        return {
          label: source,
          style: 'bg-slate-500/10 text-slate-400 border-slate-500/25',
          dot: 'bg-slate-400',
        };
    }
  };

  const categoryBadge = (category: string) => {
    switch (category) {
      case 'Product Management (PM)':
        return 'bg-indigo-500/10 text-indigo-300 border-indigo-500/20';
      case 'Technical Program Management (TPM)':
        return 'bg-cyan-500/10 text-cyan-300 border-cyan-500/20';
      case 'Project Management':
        return 'bg-violet-500/10 text-violet-300 border-violet-500/20';
      case 'Operations':
        return 'bg-emerald-500/10 text-emerald-300 border-emerald-500/20';
      default:
        return 'bg-slate-800 text-slate-300 border-slate-700/60';
    }
  };

  const countryFlag = (country: string) => {
    if (country === 'Canada') return '🇨🇦 Canada';
    if (country === 'United States') return '🇺🇸 US';
    return '🌐 Remote / Flex';
  };

  const hasActiveFilters = Boolean(
    search ||
      categoryFilter !== 'all' ||
      countryFilter !== 'all' ||
      sourceFilter !== 'all' ||
      statusFilter !== 'all'
  );

  const clearAllFilters = () => {
    setSearch('');
    setCategoryFilter('all');
    setCountryFilter('all');
    setSourceFilter('all');
    setStatusFilter('all');
  };

  return (
    <div className="min-h-screen bg-[#070b14] text-slate-100 flex flex-col relative selection:bg-blue-600 selection:text-white">
      {/* Background ambient lighting */}
      <div className="fixed inset-0 bg-grid pointer-events-none opacity-40" />
      <div className="fixed top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-[450px] radial-glow pointer-events-none" />
      <div className="fixed top-40 right-10 w-[500px] h-[400px] radial-glow-indigo pointer-events-none" />

      {/* Top Navbar */}
      <header className="border-b border-white/[0.07] bg-[#090e1c]/80 backdrop-blur-xl sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex flex-wrap items-center justify-between gap-4">
          {/* Logo & Subtitle */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-sky-400 flex items-center justify-center shadow-lg shadow-blue-500/25 ring-1 ring-white/20 shrink-0">
              <span className="text-xl">⚡</span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base sm:text-lg font-bold tracking-tight text-white flex items-center gap-2">
                  Internship Radar
                </h1>
                <span className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                  Live Email Funnel
                </span>
              </div>
              <p className="text-xs text-slate-400 font-normal">
                PM, TPM, Project Management & Operations Internships (US & Canada)
              </p>
            </div>
          </div>

          {/* Right Action Bar */}
          <div className="flex items-center gap-2.5 sm:gap-3">
            {/* View Mode Toggle */}
            <div className="hidden sm:flex items-center bg-slate-900/90 border border-white/[0.08] rounded-lg p-1 text-xs">
              <button
                onClick={() => handleSetViewMode('grid')}
                className={`p-1.5 rounded-md transition-all ${
                  viewMode === 'grid'
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
                title="Grid Card View"
              >
                <LayoutGrid className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => handleSetViewMode('list')}
                className={`p-1.5 rounded-md transition-all ${
                  viewMode === 'list'
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
                title="Compact List View"
              >
                <List className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Refresh Button */}
            <button
              onClick={handleManualRefresh}
              disabled={refreshing}
              className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-200 border border-white/[0.1] hover:border-blue-500/40 transition-all shadow-sm disabled:opacity-50 active:scale-95"
              title="Refresh live postings"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin text-blue-400' : 'text-slate-400'}`} />
              <span className="hidden sm:inline">Refresh</span>
            </button>

            {/* Status indicator */}
            <div className="text-right hidden md:block border-l border-white/[0.08] pl-3">
              <span className="text-[11px] text-slate-400 block font-mono">
                {lastUpdated ? formatRelativeTime(lastUpdated) : 'Synced'}
              </span>
              <span className="text-[10px] text-emerald-400/90 font-medium flex items-center justify-end gap-1">
                <span className="w-1 h-1 rounded-full bg-emerald-400"></span>
                {sourceUsed === 'github-live' ? 'Synced with Git' : 'Live Snapshot'}
              </span>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Stats (Interactive Cards) */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 pb-2 w-full z-10">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
          {/* Past 24h Card */}
          <button
            onClick={() => setTimeFilter('24h')}
            className={`p-4 rounded-2xl border text-left transition-all relative overflow-hidden group ${
              timeFilter === '24h'
                ? 'bg-gradient-to-br from-amber-500/15 via-slate-900/90 to-slate-900 border-amber-500/50 shadow-lg shadow-amber-500/10 ring-1 ring-amber-500/30'
                : 'bg-slate-900/60 border-white/[0.08] hover:border-white/[0.2] hover:bg-slate-900/90'
            }`}
          >
            <div className="flex items-center justify-between text-slate-400 mb-1.5">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-amber-300/90 flex items-center gap-1">
                <Flame className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
                Past 24 Hours
              </span>
              <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-amber-400/10 text-amber-400 font-mono">
                New
              </span>
            </div>
            <div className="text-2xl sm:text-3xl font-extrabold text-amber-400 tracking-tight">
              {past24hCount}
            </div>
            <span className="text-[11px] text-slate-400 mt-0.5 block truncate">
              Emailed in last 24h
            </span>
          </button>

          {/* Past 48h Card */}
          <button
            onClick={() => setTimeFilter('48h')}
            className={`p-4 rounded-2xl border text-left transition-all relative overflow-hidden group ${
              timeFilter === '48h'
                ? 'bg-gradient-to-br from-sky-500/15 via-slate-900/90 to-slate-900 border-sky-500/50 shadow-lg shadow-sky-500/10 ring-1 ring-sky-500/30'
                : 'bg-slate-900/60 border-white/[0.08] hover:border-white/[0.2] hover:bg-slate-900/90'
            }`}
          >
            <div className="flex items-center justify-between text-slate-400 mb-1.5">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-sky-300/90 flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5 text-sky-400" />
                Past 48 Hours
              </span>
              <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-sky-400/10 text-sky-400 font-mono">
                2 Days
              </span>
            </div>
            <div className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              {past48hCount}
            </div>
            <span className="text-[11px] text-slate-400 mt-0.5 block truncate">
              Weekend + Friday drops
            </span>
          </button>

          {/* Active Roles Card */}
          <button
            onClick={() => setTimeFilter('all')}
            className={`p-4 rounded-2xl border text-left transition-all relative overflow-hidden group ${
              timeFilter === 'all'
                ? 'bg-gradient-to-br from-blue-500/15 via-slate-900/90 to-slate-900 border-blue-500/50 shadow-lg shadow-blue-500/10 ring-1 ring-blue-500/30'
                : 'bg-slate-900/60 border-white/[0.08] hover:border-white/[0.2] hover:bg-slate-900/90'
            }`}
          >
            <div className="flex items-center justify-between text-slate-400 mb-1.5">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-blue-300/90 flex items-center gap-1">
                <Briefcase className="w-3.5 h-3.5 text-blue-400" />
                Total In Feed
              </span>
              <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-blue-400/10 text-blue-400 font-mono">
                {uniqueCompaniesCount} Cos
              </span>
            </div>
            <div className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              {jobs.length}
            </div>
            <span className="text-[11px] text-slate-400 mt-0.5 block truncate">
              Roles across season
            </span>
          </button>

          {/* Application Pipeline Card */}
          <button
            onClick={() => setStatusFilter(statusFilter === 'applied' ? 'all' : 'applied')}
            className={`p-4 rounded-2xl border text-left transition-all relative overflow-hidden group ${
              statusFilter === 'applied'
                ? 'bg-gradient-to-br from-emerald-500/15 via-slate-900/90 to-slate-900 border-emerald-500/50 shadow-lg shadow-emerald-500/10 ring-1 ring-emerald-500/30'
                : 'bg-slate-900/60 border-white/[0.08] hover:border-white/[0.2] hover:bg-slate-900/90'
            }`}
          >
            <div className="flex items-center justify-between text-slate-400 mb-1.5">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-emerald-300/90 flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                My Pipeline
              </span>
              <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-emerald-400/10 text-emerald-400 font-mono">
                Tracked
              </span>
            </div>
            <div className="text-2xl sm:text-3xl font-extrabold text-emerald-400 tracking-tight flex items-baseline gap-1.5">
              {appliedIds.length}
              <span className="text-sm font-normal text-slate-400">applied</span>
              <span className="text-xs text-slate-500 font-normal">/ {savedIds.length} saved</span>
            </div>
            <span className="text-[11px] text-slate-400 mt-0.5 block truncate">
              {statusFilter === 'applied' ? 'Filtering applied roles' : 'Click to filter applied'}
            </span>
          </button>
        </div>
      </div>

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5 w-full flex-1 flex flex-col z-10">
        {/* Modern Filter Toolbar */}
        <div className="bg-[#0b101f]/90 border border-white/[0.09] rounded-2xl p-4 sm:p-5 shadow-xl shadow-black/40 mb-6 space-y-4 backdrop-blur-md">
          {/* Row 1: Search + Time Window Tabs */}
          <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
            {/* Search Input with Shortcut */}
            <div className="relative flex-1 group">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-400 transition-colors" />
              <input
                ref={searchInputRef}
                type="text"
                placeholder="Search by company, role title, city, or track... (Press / to focus)"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-20 py-2.5 rounded-xl bg-[#070b16] border border-white/[0.09] text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500 transition-all shadow-inner"
              />
              <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1.5">
                {search ? (
                  <button
                    onClick={() => setSearch('')}
                    className="p-1 rounded-md text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                    title="Clear search"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                ) : (
                  <kbd className="hidden sm:inline-block px-1.5 py-0.5 rounded text-[10px] font-mono text-slate-500 bg-slate-900 border border-slate-800">
                    ⌘K
                  </kbd>
                )}
              </div>
            </div>

            {/* Time Horizon Segmented Control */}
            <div className="flex items-center bg-[#070b16] p-1 rounded-xl border border-white/[0.08] text-xs font-medium shrink-0 overflow-x-auto">
              <button
                onClick={() => setTimeFilter('24h')}
                className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 whitespace-nowrap ${
                  timeFilter === '24h'
                    ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold shadow-md shadow-blue-600/30'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                }`}
              >
                <Clock className="w-3.5 h-3.5" />
                Past 24h
                <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono ${
                  timeFilter === '24h' ? 'bg-black/30 text-white' : 'bg-slate-800 text-slate-400'
                }`}>
                  {past24hCount}
                </span>
              </button>
              <button
                onClick={() => setTimeFilter('48h')}
                className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 whitespace-nowrap ${
                  timeFilter === '48h'
                    ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold shadow-md shadow-blue-600/30'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                }`}
              >
                Past 48h
                <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono ${
                  timeFilter === '48h' ? 'bg-black/30 text-white' : 'bg-slate-800 text-slate-400'
                }`}>
                  {past48hCount}
                </span>
              </button>
              <button
                onClick={() => setTimeFilter('7d')}
                className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 whitespace-nowrap ${
                  timeFilter === '7d'
                    ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold shadow-md shadow-blue-600/30'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                }`}
              >
                Past 7d
                <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono ${
                  timeFilter === '7d' ? 'bg-black/30 text-white' : 'bg-slate-800 text-slate-400'
                }`}>
                  {past7dCount}
                </span>
              </button>
              <button
                onClick={() => setTimeFilter('all')}
                className={`px-3 py-1.5 rounded-lg transition-all whitespace-nowrap ${
                  timeFilter === 'all'
                    ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold shadow-md shadow-blue-600/30'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                }`}
              >
                All Active ({jobs.length})
              </button>
            </div>
          </div>

          {/* Row 2: Secondary Dropdowns (Track, Location, Source, Status, Sort) */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5 pt-3 border-t border-white/[0.07] text-xs">
            {/* Category */}
            <div>
              <label className="block text-[10px] uppercase font-semibold text-slate-400 mb-1 tracking-wider">
                Role Track
              </label>
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="w-full bg-[#070b16] border border-white/[0.09] rounded-xl px-2.5 py-2 text-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500 font-medium"
              >
                <option value="all">All Role Tracks</option>
                <option value="Product Management (PM)">Product Management (PM)</option>
                <option value="Technical Program Management (TPM)">Technical Program (TPM)</option>
                <option value="Project Management">Project Management</option>
                <option value="Operations">Operations</option>
              </select>
            </div>

            {/* Country */}
            <div>
              <label className="block text-[10px] uppercase font-semibold text-slate-400 mb-1 tracking-wider">
                Location
              </label>
              <select
                value={countryFilter}
                onChange={(e) => setCountryFilter(e.target.value)}
                className="w-full bg-[#070b16] border border-white/[0.09] rounded-xl px-2.5 py-2 text-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500 font-medium"
              >
                <option value="all">All Locations</option>
                <option value="United States">🇺🇸 United States</option>
                <option value="Canada">🇨🇦 Canada ({canadaRolesCount})</option>
                <option value="Remote / Flexible">🌐 Remote / Flexible</option>
              </select>
            </div>

            {/* Board Source */}
            <div>
              <label className="block text-[10px] uppercase font-semibold text-slate-400 mb-1 tracking-wider">
                Board Source
              </label>
              <select
                value={sourceFilter}
                onChange={(e) => setSourceFilter(e.target.value)}
                className="w-full bg-[#070b16] border border-white/[0.09] rounded-xl px-2.5 py-2 text-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500 font-medium"
              >
                <option value="all">All Sources</option>
                <option value="LinkedIn">💼 LinkedIn Guest</option>
                <option value="Workday">🏢 Workday Portals</option>
                <option value="ATS">🎯 ATS (Greenhouse/Ashby/Lever)</option>
                <option value="Simplify">⚡ Simplify Boards</option>
              </select>
            </div>

            {/* Pipeline Status */}
            <div>
              <label className="block text-[10px] uppercase font-semibold text-slate-400 mb-1 tracking-wider">
                My Applications
              </label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
                className="w-full bg-[#070b16] border border-white/[0.09] rounded-xl px-2.5 py-2 text-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500 font-medium"
              >
                <option value="all">All Postings</option>
                <option value="unapplied">Unapplied Only</option>
                <option value="applied">✓ Applied ({appliedIds.length})</option>
                <option value="saved">★ Bookmarked ({savedIds.length})</option>
              </select>
            </div>

            {/* Sort Order */}
            <div className="col-span-2 sm:col-span-1">
              <label className="block text-[10px] uppercase font-semibold text-slate-400 mb-1 tracking-wider">
                Sort Order
              </label>
              <select
                value={sortOrder}
                onChange={(e) => setSortOrder(e.target.value as SortOrder)}
                className="w-full bg-[#070b16] border border-white/[0.09] rounded-xl px-2.5 py-2 text-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500 font-medium"
              >
                <option value="newest">Newest First</option>
                <option value="oldest">Oldest First</option>
                <option value="company">Company (A-Z)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Results Header Summary Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <div className="flex items-center gap-2 flex-wrap">
            <h2 className="text-sm font-semibold text-slate-200 flex items-center gap-2">
              Showing <span className="text-white font-bold px-2 py-0.5 rounded-md bg-white/[0.08]">{filteredJobs.length}</span> postings
            </h2>
            {timeFilter === '24h' && (
              <span className="text-xs text-amber-300 font-medium bg-amber-500/10 px-2.5 py-0.5 rounded-full border border-amber-500/20 flex items-center gap-1">
                <Flame className="w-3 h-3 text-amber-400" />
                Dispatched in past 24 hours
              </span>
            )}
            {timeFilter === '48h' && (
              <span className="text-xs text-sky-300 font-medium bg-sky-500/10 px-2.5 py-0.5 rounded-full border border-sky-500/20 flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-sky-400" />
                Past 48 hours (2 Days)
              </span>
            )}
          </div>

          <div className="flex items-center gap-2.5 self-start sm:self-auto">
            {hasActiveFilters && (
              <button
                onClick={clearAllFilters}
                className="text-xs text-blue-400 hover:text-blue-300 font-medium flex items-center gap-1 transition-colors px-2.5 py-1 rounded-lg bg-blue-500/10 border border-blue-500/20"
              >
                <X className="w-3 h-3" />
                Reset Filters
              </button>
            )}

            {/* Mobile View Toggle */}
            <div className="sm:hidden flex items-center bg-[#070b16] border border-white/[0.08] rounded-lg p-1 text-xs">
              <button
                onClick={() => handleSetViewMode('grid')}
                className={`p-1 rounded-md ${viewMode === 'grid' ? 'bg-blue-600 text-white' : 'text-slate-400'}`}
              >
                <LayoutGrid className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => handleSetViewMode('list')}
                className={`p-1 rounded-md ${viewMode === 'list' ? 'bg-blue-600 text-white' : 'text-slate-400'}`}
              >
                <List className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>

        {/* Content Section */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-24 text-slate-400">
            <RefreshCw className="w-8 h-8 animate-spin text-blue-500 mb-3" />
            <p className="text-sm font-medium">Syncing live internship postings...</p>
          </div>
        ) : filteredJobs.length === 0 ? (
          <div className="bg-[#0b101f]/70 border border-white/[0.08] rounded-2xl p-12 text-center max-w-lg mx-auto my-12 shadow-xl">
            <div className="w-14 h-14 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center mx-auto mb-4 text-blue-400">
              <Search className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-white mb-1.5">No postings match your current filter</h3>
            <p className="text-xs text-slate-400 mb-5 leading-relaxed">
              {timeFilter === '24h'
                ? "No new email alerts fired in the past 24 hours matching these criteria. Switch to 'Past 48 Hours' or 'All Active' to view all postings."
                : 'Try adjusting your search keywords or clearing some filters.'}
            </p>
            <button
              onClick={() => {
                setTimeFilter('all');
                clearAllFilters();
              }}
              className="px-4 py-2.5 rounded-xl text-xs font-semibold bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white transition-all shadow-lg shadow-blue-500/25 active:scale-95"
            >
              Show All Active Roles ({jobs.length})
            </button>
          </div>
        ) : viewMode === 'grid' ? (
          /* ================= GRID VIEW ================= */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pb-16">
            {filteredJobs.map((job) => {
              const isApplied = appliedIds.includes(job.id);
              const isSaved = savedIds.includes(job.id);
              const isFresh = isVeryRecent(job.first_seen);
              const src = sourceBadge(job.source);

              return (
                <div
                  key={job.id}
                  className={`rounded-2xl p-5 flex flex-col justify-between transition-all duration-200 relative group border ${
                    isApplied
                      ? 'bg-[#0a151b]/80 border-emerald-500/30 hover:border-emerald-500/50'
                      : 'bg-[#0a0f1d]/80 border-white/[0.08] hover:border-blue-500/40 hover:shadow-xl hover:shadow-blue-500/5 hover:-translate-y-0.5 backdrop-blur-md'
                  }`}
                >
                  <div>
                    {/* Header Row: Company Monogram, Name & Top Actions */}
                    <div className="flex items-start justify-between gap-3 mb-3.5">
                      <div className="flex items-center gap-3 min-w-0">
                        {/* Company Monogram Badge */}
                        <div
                          className={`w-10 h-10 rounded-xl bg-gradient-to-br flex items-center justify-center font-bold text-xs shrink-0 border shadow-sm ${getCompanyColor(
                            job.company
                          )}`}
                        >
                          {getCompanyInitials(job.company)}
                        </div>

                        <div className="min-w-0">
                          <h4 className="text-xs font-semibold text-slate-300 truncate group-hover:text-white transition-colors flex items-center gap-1.5">
                            {job.company}
                          </h4>
                          <div className="flex items-center gap-1.5 text-[11px] text-slate-400 mt-0.5">
                            <MapPin className="w-3 h-3 shrink-0 text-slate-500" />
                            <span className="truncate">{job.location || 'Location Not Specified'}</span>
                          </div>
                        </div>
                      </div>

                      {/* Bookmark & Copy Actions */}
                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          onClick={() => toggleSaved(job.id)}
                          className={`p-1.5 rounded-lg transition-colors ${
                            isSaved
                              ? 'text-amber-400 bg-amber-400/10'
                              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/80'
                          }`}
                          title={isSaved ? 'Remove bookmark' : 'Bookmark for later'}
                        >
                          <Bookmark className={`w-4 h-4 ${isSaved ? 'fill-amber-400' : ''}`} />
                        </button>
                        <button
                          onClick={() => copyJobLink(job.id, job.url)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800/80 transition-colors"
                          title="Copy application link"
                        >
                          {copiedId === job.id ? (
                            <Check className="w-4 h-4 text-emerald-400 animate-in fade-in zoom-in" />
                          ) : (
                            <Copy className="w-4 h-4" />
                          )}
                        </button>
                      </div>
                    </div>

                    {/* Role Title */}
                    <h3 className="text-sm font-bold text-white line-clamp-2 leading-snug group-hover:text-blue-200 transition-colors mb-3">
                      {job.title}
                    </h3>

                    {/* Badges Row */}
                    <div className="flex items-center gap-1.5 flex-wrap mb-4">
                      {/* Track badge */}
                      <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-md border ${categoryBadge(job.category)}`}>
                        {job.category}
                      </span>

                      {/* Source badge */}
                      <span className={`text-[10px] font-medium px-2 py-0.5 rounded-md border flex items-center gap-1 ${src.style}`}>
                        <span className={`w-1 h-1 rounded-full ${src.dot}`}></span>
                        {src.label}
                      </span>

                      {/* Country badge */}
                      <span className="text-[10px] font-medium px-2 py-0.5 rounded-md bg-slate-900 text-slate-300 border border-white/[0.08]">
                        {countryFlag(job.country)}
                      </span>
                    </div>
                  </div>

                  {/* Footer Row: Timestamp & Buttons */}
                  <div className="pt-3.5 border-t border-white/[0.07] flex items-center justify-between gap-2 mt-auto">
                    <span className="text-[11px] text-slate-400 flex items-center gap-1.5 font-mono">
                      {isFresh ? (
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping"></span>
                      ) : (
                        <Clock className="w-3 h-3 text-slate-500" />
                      )}
                      {formatRelativeTime(job.first_seen)}
                    </span>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => toggleApplied(job.id)}
                        className={`text-[11px] font-semibold px-2.5 py-1.5 rounded-xl border transition-all ${
                          isApplied
                            ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 shadow-sm'
                            : 'bg-slate-900 text-slate-300 border-white/[0.08] hover:bg-slate-800 hover:text-white'
                        }`}
                      >
                        {isApplied ? '✓ Applied' : 'Mark Applied'}
                      </button>

                      <a
                        href={job.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white transition-all shadow-md shadow-blue-500/20 active:scale-95"
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
        ) : (
          /* ================= COMPACT LIST VIEW ================= */
          <div className="bg-[#0a0f1d]/90 border border-white/[0.08] rounded-2xl overflow-hidden shadow-xl mb-16 backdrop-blur-md divide-y divide-white/[0.06]">
            {filteredJobs.map((job) => {
              const isApplied = appliedIds.includes(job.id);
              const isSaved = savedIds.includes(job.id);
              const isFresh = isVeryRecent(job.first_seen);
              const src = sourceBadge(job.source);

              return (
                <div
                  key={job.id}
                  className={`p-3.5 sm:px-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-white/[0.02] transition-colors ${
                    isApplied ? 'bg-emerald-950/15' : ''
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <div
                      className={`w-9 h-9 rounded-xl bg-gradient-to-br flex items-center justify-center font-bold text-xs shrink-0 border ${getCompanyColor(
                        job.company
                      )}`}
                    >
                      {getCompanyInitials(job.company)}
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold text-xs text-slate-300">{job.company}</span>
                        <span className={`text-[10px] font-semibold px-1.5 py-0.2 rounded border ${categoryBadge(job.category)}`}>
                          {job.category}
                        </span>
                        <span className={`text-[10px] font-medium px-1.5 py-0.2 rounded border ${src.style}`}>
                          {src.label}
                        </span>
                      </div>
                      <h3 className="text-sm font-bold text-white truncate hover:text-blue-300 transition-colors">
                        {job.title}
                      </h3>
                      <div className="text-[11px] text-slate-400 flex items-center gap-2 truncate">
                        <span>{job.location || 'Location Not Specified'}</span>
                        <span>·</span>
                        <span>{countryFlag(job.country)}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-white/[0.04]">
                    <span className="text-[11px] text-slate-400 font-mono flex items-center gap-1">
                      {isFresh && <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping"></span>}
                      {formatRelativeTime(job.first_seen)}
                    </span>

                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => toggleSaved(job.id)}
                        className={`p-1.5 rounded-lg transition-colors ${
                          isSaved ? 'text-amber-400 bg-amber-400/10' : 'text-slate-400 hover:text-white'
                        }`}
                        title="Bookmark"
                      >
                        <Bookmark className={`w-3.5 h-3.5 ${isSaved ? 'fill-amber-400' : ''}`} />
                      </button>

                      <button
                        onClick={() => toggleApplied(job.id)}
                        className={`text-[11px] font-medium px-2.5 py-1 rounded-lg border transition-all ${
                          isApplied
                            ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                            : 'bg-slate-900 text-slate-300 border-white/[0.08] hover:bg-slate-800'
                        }`}
                      >
                        {isApplied ? '✓ Applied' : 'Mark'}
                      </button>

                      <a
                        href={job.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-xs font-semibold px-3 py-1 rounded-lg bg-blue-600 hover:bg-blue-500 text-white transition-all shadow-sm shadow-blue-500/20"
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
      </main>

      {/* Footer */}
      <footer className="border-t border-white/[0.07] bg-[#070b14] py-8 text-center text-xs text-slate-500 mt-auto z-10">
        <div className="max-w-7xl mx-auto px-4 space-y-1.5">
          <p className="font-semibold text-slate-400">
            Internship Radar · Real-Time PM, TPM, Project & Operations Tracker
          </p>
          <p className="text-[11px] text-slate-500">
            Continuously tracking LinkedIn, Workday, Greenhouse, Ashby, Lever, and Simplify with direct email funnel synchronization.
          </p>
        </div>
      </footer>
    </div>
  );
}

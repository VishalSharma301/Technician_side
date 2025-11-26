// src/store/JobContext.tsx - FIXED VERSION
// Removes type annotation conflicts with new API response types

import React, {
  createContext,
  useContext,
  useMemo,
  useState,
  ReactNode,
  useCallback,
} from "react";
import { Job, JobStats, JobStatus } from "../constants/jobTypes";
import { getMyServiceRequests } from "../util/servicesApi";

// ============================================
// CONTEXT INTERFACE
// ============================================

interface JobContextValue {
  jobs: Job[];
  loading: boolean;
  error: string | null;
  stats: JobStats;
  refreshing: boolean;

  // Setters
  setLoading: (v: boolean) => void;
  setError: (msg: string | null) => void;
  setJobs: (list: Job[]) => void;
  setStats: (stats: JobStats) => void;
  setRefreshing: (v: boolean) => void;

  // Actions
  addJob: (j: Job) => void;
  updateJob: (id: string, updates: Partial<Job>) => void;
  updateStatus: (id: string, status: JobStatus) => void;
  removeJob: (id: string) => void;

  // Fetch functions
  fetchJobs: (filters?: any) => Promise<void>;
  fetchTodayJobs: () => Promise<void>;
  fetchActiveJobs: () => Promise<void>;
  refreshJobs: () => Promise<void>;
}

// ============================================
// CONTEXT CREATION
// ============================================

const JobContext = createContext<JobContextValue | undefined>(undefined);

// ============================================
// INITIAL STATS
// ============================================

const initialStats: JobStats = {
  totalJobs: 0,
  assigned: 0,
  inProgress: 0,
  completed: 0,
  cancelled: 0,
  totalEarnings: 0,
  todayJobs: 0,
};

// ============================================
// PROVIDER COMPONENT
// ============================================

interface JobContextProviderProps {
  children: ReactNode;
}

export function JobContextProvider({ children }: JobContextProviderProps) {
  const [jobs, setJobsState] = useState<Job[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<JobStats>(initialStats);

  // ============================================
  // FETCH JOBS WITH FILTERS
  // ============================================

  const fetchJobs = useCallback(async (filters: any = {}) => {
    try {
      setLoading(true);
      setError(null);

      // ✅ FIX: Removed type annotation - let TypeScript infer ServiceRequestsResponse
      const response = await getMyServiceRequests(filters);

      if (response && response.success) {
        // ✅ FIX: Cast data to Job[] since ServiceRequest and Job are structurally identical
        setJobsState(response.data as unknown as Job[]);
        setStats(response.stats);
        console.log("Jobs fetched successfully:", response.stats);
      } else {
        setError("Failed to fetch jobs");
        console.error("Failed to fetch jobs");
      }
    } catch (err: any) {
      setError(err.message || "Error fetching jobs");
      console.error("Error fetching jobs:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  // ============================================
  // FETCH TODAY'S JOBS
  // ============================================

  const fetchTodayJobs = useCallback(async () => {
    await fetchJobs({
      today: true,
      sortBy: "scheduledDate",
      sortOrder: "asc",
    });
  }, [fetchJobs]);

  // ============================================
  // FETCH ACTIVE JOBS
  // ============================================

  const fetchActiveJobs = useCallback(async () => {
    await fetchJobs({
      active: true,
    });
  }, [fetchJobs]);

  // ============================================
  // REFRESH JOBS (FOR PULL-TO-REFRESH)
  // ============================================

  const refreshJobs = useCallback(async () => {
    try {
      setRefreshing(true);
      setError(null);

      // ✅ FIX: Removed type annotation
      const response = await getMyServiceRequests();

      if (response && response.success) {
        // ✅ FIX: Cast data to Job[]
        setJobsState(response.data as unknown as Job[]);
        setStats(response.stats);
        console.log("Jobs refreshed successfully");
      } else {
        setError("Failed to refresh jobs");
      }
    } catch (err: any) {
      setError(err.message || "Error refreshing jobs");
      console.error("Error refreshing jobs:", err);
    } finally {
      setRefreshing(false);
    }
  }, []);

  // ============================================
  // MANUAL SETTERS
  // ============================================

  const setJobs = useCallback((list: Job[]) => {
    setJobsState(list);
  }, []);

  // ============================================
  // ADD JOB
  // ============================================

  const addJob = useCallback((job: Job) => {
    setJobsState((prev) => [job, ...prev]);

    // Update stats
    setStats((prev) => ({
      ...prev,
      totalJobs: prev.totalJobs + 1,
      assigned:
        job.status === JobStatus.TECHNICIAN_ASSIGNED
          ? prev.assigned + 1
          : prev.assigned,
      inProgress:
        job.status === JobStatus.IN_PROGRESS
          ? prev.inProgress + 1
          : prev.inProgress,
      completed:
        job.status === JobStatus.COMPLETED
          ? prev.completed + 1
          : prev.completed,
    }));
  }, []);

  // ============================================
  // UPDATE JOB
  // ============================================

  const updateJob = useCallback((id: string, updates: Partial<Job>) => {
    setJobsState((prev) =>
      prev.map((job) => (job._id === id ? { ...job, ...updates } : job))
    );
  }, []);

  // ============================================
  // UPDATE JOB STATUS
  // ============================================

  const updateStatus = useCallback((id: string, newStatus: JobStatus) => {
    setJobsState((prev) => {
      const oldJob = prev.find((j) => j._id === id);
      if (!oldJob) return prev;

      const oldStatus = oldJob.status;

      // Update stats based on status change
      setStats((prevStats) => {
        const newStats = { ...prevStats };

        // Decrement old status count
        if (oldStatus === JobStatus.TECHNICIAN_ASSIGNED) newStats.assigned--;
        if (oldStatus === JobStatus.IN_PROGRESS) newStats.inProgress--;
        if (oldStatus === JobStatus.COMPLETED) newStats.completed--;
        if (oldStatus === JobStatus.CANCELLED) newStats.cancelled--;

        // Increment new status count
        if (newStatus === JobStatus.TECHNICIAN_ASSIGNED) newStats.assigned++;
        if (newStatus === JobStatus.IN_PROGRESS) newStats.inProgress++;
        if (newStatus === JobStatus.COMPLETED) newStats.completed++;
        if (newStatus === JobStatus.CANCELLED) newStats.cancelled++;

        return newStats;
      });

      // Update job in list
      return prev.map((job) =>
        job._id === id ? { ...job, status: newStatus } : job
      );
    });
  }, []);

  // ============================================
  // REMOVE JOB
  // ============================================

  const removeJob = useCallback((id: string) => {
    setJobsState((prev) => {
      const job = prev.find((j) => j._id === id);
      if (!job) return prev;

      // Update stats
      setStats((prevStats) => ({
        ...prevStats,
        totalJobs: prevStats.totalJobs - 1,
        assigned:
          job.status === JobStatus.TECHNICIAN_ASSIGNED
            ? prevStats.assigned - 1
            : prevStats.assigned,
        inProgress:
          job.status === JobStatus.IN_PROGRESS
            ? prevStats.inProgress - 1
            : prevStats.inProgress,
        completed:
          job.status === JobStatus.COMPLETED
            ? prevStats.completed - 1
            : prevStats.completed,
        cancelled:
          job.status === JobStatus.CANCELLED
            ? prevStats.cancelled - 1
            : prevStats.cancelled,
      }));

      return prev.filter((j) => j._id !== id);
    });
  }, []);

  // ============================================
  // MEMOIZED VALUE
  // ============================================

  const value = useMemo<JobContextValue>(
    () => ({
      jobs,
      loading,
      error,
      stats,
      refreshing,
      setLoading,
      setError,
      setJobs,
      setStats,
      setRefreshing,
      addJob,
      updateJob,
      updateStatus,
      removeJob,
      fetchJobs,
      fetchTodayJobs,
      fetchActiveJobs,
      refreshJobs,
    }),
    [
      jobs,
      loading,
      error,
      stats,
      refreshing,
      addJob,
      updateJob,
      updateStatus,
      removeJob,
      fetchJobs,
      fetchTodayJobs,
      fetchActiveJobs,
      refreshJobs,
    ]
  );

  return <JobContext.Provider value={value}>{children}</JobContext.Provider>;
}

// ============================================
// CUSTOM HOOK
// ============================================

export function useJobs(): JobContextValue {
  const context = useContext(JobContext);
  if (!context) {
    throw new Error("useJobs must be used within JobContextProvider");
  }
  return context;
}

export default JobContext;

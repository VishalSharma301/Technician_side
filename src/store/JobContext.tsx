import React, { createContext, useContext, useMemo, useState, ReactNode } from 'react';
import { Job, JobStatus, JobStats } from '../constants/jobTypes';

interface JobContextValue {
  jobs: Job[];
  loading: boolean;
  error: string | null;
  stats: JobStats;
  /* setters */
  setLoading: (v: boolean) => void;
  setError: (msg: string | null) => void;
  setJobs: (list: Job[]) => void;
  addJob: (j: Job) => void;
  updateStatus: (id: string, status: JobStatus) => void;
}

const JobContext = createContext<JobContextValue | undefined>(undefined);

export const JobContextProvider = ({ children }: { children: ReactNode }) => {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /* basic helpers */
  // const addJob = (job: Job) => setJobs(prev => [job, ...prev]);

  const addJob = (job: Job) => {
  setJobs(prev => {
    // If job already exists, return unchanged array
    if (prev.some(j => j._id === job._id)) {
      return prev;
    }
    // Otherwise, prepend it
    return [job, ...prev];
  });
};


  const updateStatus = (id: string, status: JobStatus) =>
    setJobs(prev =>
      prev.map(j => (j._id === id ? { ...j, status } : j)),
    );

  /* map JobStatus to JobStats keys */
  const statusToKey: Record<JobStatus, keyof JobStats> = {
    [JobStatus.PENDING]: 'pending',
    [JobStatus.ONGOING]: 'ongoing',
    [JobStatus.COMPLETED]: 'completed',
    [JobStatus.DEADLINE_ALERT]: 'deadlineAlert',
  };

  /* derive counters */
  const stats = useMemo<JobStats>(() => {
    const base: JobStats = {
      pending: 0,
      ongoing: 0,
      completed: 0,
      deadlineAlert: 0,
    };
    jobs.forEach(j => {
      const key = statusToKey[j.status];
      base[key] += 1;
    });
    return base;
  }, [jobs]);

  const value: JobContextValue = {
    jobs,
    loading,
    error,
    stats,
    setLoading,
    setError,
    setJobs,
    addJob,
    updateStatus,
  };

  return <JobContext.Provider value={value}>{children}</JobContext.Provider>;
};

export const useJobs = (): JobContextValue => {
  const ctx = useContext(JobContext);
  if (!ctx) throw new Error('useJobs must be used inside <JobContextProvider>');
  return ctx;
};

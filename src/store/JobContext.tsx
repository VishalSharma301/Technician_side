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

// const mockJob = {
//   __v: 0,
//   _id: 'job_' + Math.random().toString(36).substring(2, 10),
//   createdAt: '2025-08-14T09:15:23.456Z',
//   notes: 'Please check water pressure before installation.',
//   provider: {
//     _id: 'prov_' + Math.random().toString(36).substring(2, 10),
//     companyName: 'AquaFix Services',
//     phoneNumber: '+919876543210'
//   },
//   providerAssignedAt: '2025-08-14T09:20:00.000Z',
//   requestSubmittedAt: '2025-08-14T09:10:00.000Z',
//   scheduledDate: '2025-08-16T14:30:00.000Z',
//   service: {
//     _id: 'serv_' + Math.random().toString(36).substring(2, 10),
//     name: 'RO Installation',
//     category: 'plumbing',
//     basePrice: 1200
//   },
//   status: JobStatus.PENDING, // could also be 'in_progress', 'completed', etc.
//   technician: 'tech_' + Math.random().toString(36).substring(2, 10),
//   technicianAssignedAt: '2025-08-14T10:00:00.000Z',
//   user: {
//     _id: 'user_' + Math.random().toString(36).substring(2, 10),
//     name: 'Rahul Verma',
//     phoneNumber: '+919812345678',
//     email: 'rahul.verma@example.com'
//   },
//   zipcode: '110001',
  
//   // extra date fields
//   expiresAt: '2025-08-16T17:00:00.000Z',
//   startedAt: undefined,
//   completedAt: undefined,
//   receivedAt: '2025-08-14T09:15:23.456Z'
// }

const makeMockJob = (status: JobStatus) => ({
  __v: 0,
  _id: "job_" + Math.random().toString(36).substring(2, 10),
  createdAt: "2025-08-14T09:15:23.456Z",
  notes: "Please check water pressure before installation.",
  provider: {
    _id: "prov_" + Math.random().toString(36).substring(2, 10),
    companyName: "AquaFix Services",
    phoneNumber: "+919876543210",
  },
  providerAssignedAt: "2025-08-14T09:20:00.000Z",
  requestSubmittedAt: "2025-08-14T09:10:00.000Z",
  scheduledDate: "2025-08-16T14:30:00.000Z",
  service: {
    _id: "serv_" + Math.random().toString(36).substring(2, 10),
    name: "RO Installation",
    category: "plumbing",
    basePrice: 1200,
  },
  status,
  technician: "tech_" + Math.random().toString(36).substring(2, 10),
  technicianAssignedAt: "2025-08-14T10:00:00.000Z",
  user: {
    _id: "user_" + Math.random().toString(36).substring(2, 10),
    name: "Rahul Verma",
    phoneNumber: "+919812345678",
    email: "rahul.verma@example.com",
  },
  zipcode: "110001",

  // extra date fields
  expiresAt: "2025-08-16T17:00:00.000Z",
  startedAt: status === JobStatus.ONGOING ? "2025-08-16T14:45:00.000Z" : undefined,
  completedAt: status === JobStatus.COMPLETED ? "2025-08-16T16:00:00.000Z" : undefined,
  receivedAt: "2025-08-14T09:15:23.456Z",
});

export const mockJobs = [
  makeMockJob(JobStatus.PENDING),
  makeMockJob(JobStatus.ONGOING),
  makeMockJob(JobStatus.COMPLETED),
  makeMockJob(JobStatus.DEADLINE_ALERT),
  makeMockJob(JobStatus.CANCELLED),
];


export const JobContextProvider = ({ children }: { children: ReactNode }) => {
  const [jobs, setJobs] = useState<Job[]>(mockJobs);
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
    [JobStatus.CANCELLED]: 'cancelled',
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

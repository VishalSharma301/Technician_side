

import axios, { AxiosError, AxiosRequestConfig } from 'axios';
import { Job, JobStatus } from '../constants/jobTypes';

export interface CheckJobsResponse {
  success: boolean;
  jobs: Job[];
  updates?: Array<{
    jobId: string;
    status: JobStatus;
    data?: any;
  }>;
}

// Base URL for your mock backend
// let BASE_URL = 'http://localhost:5000/api';
let BASE_URL = 'https://st51mzlz-8080.inc1.devtunnels.ms/api';

// Current technician ID (set via setter below)
let technicianId: string | null = null;

// Placeholder for auth token retrieval
async function getAuthToken(): Promise<string> {
  // Replace with real logic if needed
  return 'mock-auth-token';
}

// Low-level request helper
async function makeRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${BASE_URL}${endpoint}`;
  const token = await getAuthToken();

  const res = await fetch(url, {
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    ...options,
  });

  if (!res.ok) {
    const msg = `HTTP ${res.status}: ${res.statusText}`;
    throw new Error(msg);
  }
  return res.json();
}

// Setter to choose base URL (for emulator vs. device, etc.)
export function setBaseUrl(url: string) {
  BASE_URL = url;
}

// Setter for technician ID
export function setTechnicianId(id: string) {
  technicianId = id;
}

// Polling endpoint
export async function checkForJobs(): Promise<Job[]> {
  if (!technicianId) throw new Error('Technician ID not set');
  const resp = await makeRequest<CheckJobsResponse>(`/technicians/${technicianId}/check-jobs`);
  if (!resp.success) return [];
  return resp.jobs.map(j => ({
    ...j,
    receivedAt: j.receivedAt ? new Date(j.receivedAt) : new Date(),
    expiresAt: j.expiresAt ? new Date(j.expiresAt) : new Date(Date.now() + 300000),
    startedAt: j.startedAt ? new Date(j.startedAt) : undefined,
    completedAt: j.completedAt ? new Date(j.completedAt) : undefined,
  }));
}

// Fetch full job list
export async function getJobs(): Promise<Job[]> {
  if (!technicianId) throw new Error('Technician ID not set');
  const resp = await makeRequest<{ jobs: Job[] }>(`/technicians/${technicianId}/jobs`);
  return resp.jobs.map(j => ({
    ...j,
    receivedAt: j.receivedAt ? new Date(j.receivedAt) : undefined,
    expiresAt: j.expiresAt ? new Date(j.expiresAt) : undefined,
    startedAt: j.startedAt ? new Date(j.startedAt) : undefined,
    completedAt: j.completedAt ? new Date(j.completedAt) : undefined,
  }));
}

// Accept a job
export async function acceptJob(jobId: string): Promise<void> {
  await makeRequest(`/jobs/${jobId}/accept`, { method: 'POST' });
}

// Start a job
export async function startJob(jobId: string): Promise<void> {
  await makeRequest(`/jobs/${jobId}/start`, { method: 'POST' });
}

// Complete a job
export async function completeJob(jobId: string): Promise<void> {
  await makeRequest(`/jobs/${jobId}/complete`, { method: 'POST' });
}

// Generic status update
export async function updateJobStatus(
  jobId: string,
  status: JobStatus,
  extras?: Record<string, any>
): Promise<void> {
  await makeRequest(`/jobs/${jobId}`, {
    method: 'PATCH',
    body: JSON.stringify({ status, ...extras }),
  });
}

// Seed a test job
export async function seedJob(id?: string): Promise<Job> {
  const body = id ? { technicianId: id } : { technicianId };
  return makeRequest<Job>('/seed', {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

// Create an axios instance to intercept all requests/responses
const api = axios.create({
  baseURL: BASE_URL,
  timeout: 10000, // 10s
  validateStatus: status => status >= 200 && status < 500,
});


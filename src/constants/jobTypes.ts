export enum JobStatus {
  PENDING = "pending",
  ONGOING = "in_progress",
  COMPLETED = "completed",
  DEADLINE_ALERT = "deadlineAlert",
}

/* Convenience stats object returned by context */
export interface JobStats {
  pending: number;
  ongoing: number;
  completed: number;
  deadlineAlert: number;
}

export interface JobUser {
  _id: string;
  name: string;
  phoneNumber: string;
  email: string;
}

export interface JobProvider {
  _id: string;
  companyName: string;
  phoneNumber: string;
}

export interface JobService {
  _id: string;
  name: string;
  category: string;
  basePrice: number;
}

export interface Job {
  __v: number;
  _id: string;
  createdAt: string;
  notes: string;
  provider: JobProvider;
  providerAssignedAt: string;
  requestSubmittedAt: string;
  scheduledDate: string;
  service: JobService;
  status: JobStatus;
  technician: string;
  technicianAssignedAt: string;
  user: JobUser;
  zipcode: string;
  expiresAt: string | Date | undefined;
  startedAt: string | Date | undefined;
  completedAt: string | Date | undefined;
  receivedAt: string | Date | undefined;
}

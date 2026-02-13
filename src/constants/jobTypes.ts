// src/constants/jobTypes.ts

// ============================================
// JOB STATUS TYPES
// ============================================

export enum JobStatus {
  TECHNICIAN_ASSIGNED = 'technician_assigned',
  ON_WAY = 'on_way',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
  PARTS_PENDING = "parts_pending",
  WORKSHOP_REQUIRED = "at_workshop"
}

// ============================================
// PAYMENT STATUS TYPES
// ============================================

export enum PaymentStatus {
  PENDING = 'pending',
  PAID = 'paid',
  REFUNDED = 'refunded',
}

// ============================================
// JOB INTERFACES
// ============================================

export interface ServiceCategory {
  _id: string;
  name: string;
  icon: string;
}

export interface Service {
  _id: string;
  name: string;
  category: ServiceCategory;
  icon: string;
  basePrice: number;
  description: string;
  estimatedTime: string;
}

export interface UserAddress {
  street: string;
  city: string;
  state: string;
  zipcode: string;
}

export interface JobUser {
  _id: string;
  name: string;
  phoneNumber: string;
  email: string;
  address: UserAddress;
  profilePicture?: string;
}

export interface Provider {
  _id: string;
  name: string;
  companyName: string;
  phoneNumber: string;
}

export interface SelectedOption {
  optionId: string;
  name: string;
  price: number;
}

export interface SubService {
  subServiceId: string;
  name: string;
  price: number;
}

export interface Brand {
  _id: string;
  name: string;
  logo: string;
}

export interface SelectedBrand {
  brandId: Brand;
  name: string;
}

export interface JobAddress {
  street: string;
  city: string;
  state: string;
  zipcode: string;
  coordinates?: {
    lat: number;
    lon: number;
  };
}

export interface Job {
  _id: string;
  service: Service;
  user: JobUser;
  provider: Provider;
  selectedOption?: SelectedOption;
  selectedSubServices?: SubService[];
  selectedBrand?: SelectedBrand;
  quantity: number;
  status: JobStatus;
  scheduledDate: string;
  scheduledTimeSlot: string;
  zipcode: string;
  address: JobAddress;
  finalPrice: number;
  notes?: string;
  specialInstructions?: string;
  completionPin: string;
  pinVerified: boolean;
  technicianAssignedAt: string;
  paymentStatus: PaymentStatus;
  createdAt: string;
  updatedAt: string;
}

// ============================================
// JOB STATS INTERFACE
// ============================================

export interface JobStats {
  totalJobs: number;
  assigned: number;
  inProgress: number;
  completed: number;
  cancelled: number;
  totalEarnings: number;
  todayJobs: number;
}

// ============================================
// PAGINATION INTERFACE
// ============================================

export interface Pagination {
  currentPage: number;
  totalPages: number;
  totalRequests: number;
  limit: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

// ============================================
// FILTER INTERFACES
// ============================================

export interface JobFilters {
  page?: number;
  limit?: number;
  status?: JobStatus | string;
  paymentStatus?: PaymentStatus | string;
  search?: string;
  startDate?: string;
  endDate?: string;
  completedAfter?: string;
  completedBefore?: string;
  today?: boolean;
  thisWeek?: boolean;
  thisMonth?: boolean;
  minPrice?: number;
  maxPrice?: number;
  categoryId?: string;
  pinVerified?: boolean;
  hasNotes?: boolean;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  upcoming?: boolean;
  completed?: boolean;
  active?: boolean;
}

// ============================================
// API RESPONSE INTERFACES
// ============================================

export interface JobsResponse {
  success: boolean;
  data: Job[];
  pagination: Pagination;
  stats: JobStats;
  appliedFilters: {
    status: string | null;
    paymentStatus: string | null;
    search: string | null;
    startDate: string | null;
    endDate: string | null;
    sortBy: string;
    sortOrder: string;
  };
}

export interface SingleJobResponse {
  success: boolean;
  data: Job;
}

export interface StatusUpdateResponse {
  success: boolean;
  message: string;
  data?: {
    requestId: string;
    oldStatus: string;
    newStatus: string;
    updatedAt: string;
  };
}

export interface PinVerificationResponse {
  success: boolean;
  message: string;
  data?: {
    requestId: string;
    pinVerified: boolean;
    paymentStatus: string;
  };
}

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Get display-friendly status text
 */
export function getStatusText(status: JobStatus): string {
  switch (status) {
    case JobStatus.TECHNICIAN_ASSIGNED:
      return 'Assigned';
    case JobStatus.IN_PROGRESS:
      return 'In Progress';
    case JobStatus.COMPLETED:
      return 'Completed';
    case JobStatus.CANCELLED:
      return 'Cancelled';
    default:
      return 'Unknown';
  }
}

/**
 * Get status color for UI
 */
export function getStatusColor(status: JobStatus): string {
  switch (status) {
    case JobStatus.TECHNICIAN_ASSIGNED:
      return '#165297'; // Blue
    case JobStatus.IN_PROGRESS:
      return '#FF9500'; // Orange
    case JobStatus.COMPLETED:
      return '#34C759'; // Green
    case JobStatus.CANCELLED:
      return '#FF3B30'; // Red
    default:
      return '#d8a327'; // Gray
  }
}

/**
 * Get payment status text
 */
export function getPaymentStatusText(paymentStatus: PaymentStatus): string {
  switch (paymentStatus) {
    case PaymentStatus.PENDING:
      return 'Pending';
    case PaymentStatus.PAID:
      return 'Paid';
    case PaymentStatus.REFUNDED:
      return 'Refunded';
    default:
      return 'Unknown';
  }
}

/**
 * Check if job can be started
 */
export function canStartJob(job: Job): boolean {
  return job.status === JobStatus.TECHNICIAN_ASSIGNED;
}

/**
 * Check if job can be completed
 */
export function canCompleteJob(job: Job): boolean {
  return job.status === JobStatus.IN_PROGRESS;
}

/**
 * Check if PIN verification is needed
 */
export function needsPinVerification(job: Job): boolean {
  return job.status === JobStatus.COMPLETED && !job.pinVerified;
}

/**
 * Format scheduled date and time
 */
export function formatScheduledDateTime(job: Job): string {
  const date = new Date(job.scheduledDate);
  const dateStr = date.toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
  return `${dateStr}, ${job.scheduledTimeSlot}`;
}

/**
 * Calculate job duration (if completed)
 */
export function calculateJobDuration(job: Job): string | null {
  if (job.status !== JobStatus.COMPLETED) return null;
  
  const start = new Date(job.technicianAssignedAt);
  const end = new Date(job.updatedAt);
  const durationMs = end.getTime() - start.getTime();
  const hours = Math.floor(durationMs / (1000 * 60 * 60));
  const minutes = Math.floor((durationMs % (1000 * 60 * 60)) / (1000 * 60));
  
  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }
  return `${minutes}m`;
}

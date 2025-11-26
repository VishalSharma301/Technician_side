// src/util/servicesApi.ts
import axios from "axios";
import { BASE } from "./BASE_URL";
import AsyncStorage from "@react-native-async-storage/async-storage";

const BASE_URL = `${BASE}/api`;

// ============================================
// TYPES & INTERFACES
// ============================================

export interface ServiceRequest {
  _id: string;
  service: {
    _id: string;
    name: string;
    category: {
      _id: string;
      name: string;
      icon: string;
    };
    icon: string;
    basePrice: number;
    description: string;
    estimatedTime: string;
  };
  user: {
    _id: string;
    name: string;
    phoneNumber: string;
    email: string;
    address: {
      street: string;
      city: string;
      state: string;
      zipcode: string;
    };
    profilePicture?: string;
  };
  provider: {
    _id: string;
    name: string;
    companyName: string;
    phoneNumber: string;
  };
  selectedOption?: {
    optionId: string;
    name: string;
    price: number;
  };
  selectedSubServices?: Array<{
    subServiceId: string;
    name: string;
    price: number;
  }>;
  selectedBrand?: {
    brandId: {
      _id: string;
      name: string;
      logo: string;
    };
    name: string;
  };
  quantity: number;
  status: "technician_assigned" | "in_progress" | "completed" | "cancelled";
  scheduledDate: string;
  scheduledTimeSlot: string;
  zipcode: string;
  address: {
    street: string;
    city: string;
    state: string;
    zipcode: string;
    coordinates?: {
      lat: number;
      lon: number;
    };
  };
  finalPrice: number;
  notes?: string;
  specialInstructions?: string;
  completionPin: string;
  pinVerified: boolean;
  technicianAssignedAt: string;
  paymentStatus: "pending" | "paid" | "refunded";
  createdAt: string;
  updatedAt: string;
}

export interface ServiceRequestsResponse {
  success: boolean;
  data: ServiceRequest[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalRequests: number;
    limit: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
  stats: {
    totalJobs: number;
    assigned: number;
    inProgress: number;
    completed: number;
    cancelled: number;
    totalEarnings: number;
    todayJobs: number;
  };
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

export interface ServiceRequestFilters {
  page?: number;
  limit?: number;
  status?: string;
  paymentStatus?: string;
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
  sortOrder?: "asc" | "desc";
  upcoming?: boolean;
  completed?: boolean;
  active?: boolean;
}

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Get authorization headers with bearer token
 */
async function getAuthHeaders() {
  const token = await AsyncStorage.getItem("token");
  return {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  };
}

/**
 * Build query string from filters object
 */
function buildQueryString(filters: ServiceRequestFilters): string {
  const params = new URLSearchParams();

  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      params.append(key, String(value));
    }
  });

  return params.toString();
}

// ============================================
// API FUNCTIONS
// ============================================

/**
 * Get all assigned service requests with filters
 * @param filters - Filter parameters for the request
 * @returns Promise with service requests response
 */
export async function getMyServiceRequests(
  filters: ServiceRequestFilters = {}
): Promise<ServiceRequestsResponse | null> {
  try {
    const headers = await getAuthHeaders();
    const queryString = buildQueryString(filters);
    const url = `${BASE_URL}/technicians/service-requests${
      queryString ? `?${queryString}` : ""
    }`;

    console.log("Fetching service requests:", url);

    const response = await axios.get(url, { headers });

    if (response.status === 200 && response.data.success) {
      console.log(
        "Service requests fetched successfully:",
        response.data.stats
      );
      return response.data;
    }

    console.warn("Unexpected response:", response.status);
    return null;
  } catch (error: any) {
    console.error(
      "Error fetching service requests:",
      error.response?.data || error.message
    );
    return null;
  }
}

/**
 * Get single service request by ID
 * @param requestId - Service request ID
 * @returns Promise with service request data
 */
export async function getServiceRequestById(
  requestId: string
): Promise<ServiceRequest | null> {
  try {
    const headers = await getAuthHeaders();
    const url = `${BASE_URL}/technicians/service-requests/${requestId}`;

    console.log("Fetching service request:", requestId);

    const response = await axios.get(url, { headers });

    if (response.status === 200 && response.data.success) {
      console.log("Service request fetched successfully");
      return response.data.data;
    }

    console.warn("Unexpected response:", response.status);
    return null;
  } catch (error: any) {
    console.error(
      "Error fetching service request:",
      error.response?.data || error.message
    );
    return null;
  }
}

/**
 * Update job status (start job or complete job)
 * @param requestId - Service request ID
 * @param status - New status ('in_progress' or 'completed')
 * @param notes - Optional notes about the status change
 * @returns Promise with update result
 */
export async function updateJobStatus(
  requestId: string,
  status: "in_progress" | "completed",
  pin?: string,
  notes?: string
): Promise<{
  success: boolean;
  message: string;
  data?: {
    requestId: string;
    oldStatus: string;
    newStatus: string;
    updatedAt: string;
  };
} | null> {
  try {
    const headers = await getAuthHeaders();
    const url = `${BASE_URL}/technicians/service-requests/${requestId}/status`;

    console.log("Updating job status:", { requestId, status, notes });

    const response = await axios.put(url, { status,pin, notes  }, { headers });

    if (response.status === 200 && response.data.success) {
      console.log("Job status updated successfully:", response.data.message);
      return response.data;
    }

    console.warn("Unexpected response:", response.status);
    return null;
  } catch (error: any) {
    console.error(
      "Error updating job status:",
      error.response?.data || error.message
    );
    return null;
  }
}

/**
 * Verify completion PIN
 * @param requestId - Service request ID
 * @param pin - 4-digit completion PIN
 * @returns Promise with verification result
 */
export async function verifyCompletionPin(
  requestId: string,
  pin: string
): Promise<{
  success: boolean;
  message: string;
  data?: {
    requestId: string;
    pinVerified: boolean;
    paymentStatus: string;
  };
} | null> {
  try {
    const headers = await getAuthHeaders();
    const url = `${BASE_URL}/technicians/service-requests/${requestId}/verify-pin`;

    console.log("Verifying completion PIN:", { requestId, pin });

    const response = await axios.post(url, { pin }, { headers });

    if (response.status === 200 && response.data.success) {
      console.log("PIN verified successfully");
      return response.data;
    }

    console.warn("Unexpected response:", response.status);
    return null;
  } catch (error: any) {
    console.error(
      "Error verifying PIN:",
      error.response?.data || error.message
    );

    // Return error message for invalid PIN
    if (error.response?.status === 400) {
      return {
        success: false,
        message: error.response.data.message || "Invalid PIN",
      };
    }

    return null;
  }
}

// ============================================
// CONVENIENCE FUNCTIONS FOR COMMON USE CASES
// ============================================

/**
 * Get today's scheduled jobs
 */
export async function getTodayJobs(): Promise<ServiceRequestsResponse | null> {
  return getMyServiceRequests({
    today: true,
    sortBy: "scheduledDate",
    sortOrder: "asc",
  });
}

/**
 * Get this week's jobs
 */
export async function getThisWeekJobs(): Promise<ServiceRequestsResponse | null> {
  return getMyServiceRequests({
    thisWeek: true,
    sortBy: "scheduledDate",
    sortOrder: "asc",
  });
}

/**
 * Get active jobs (in progress or assigned)
 */
export async function getActiveJobs(): Promise<ServiceRequestsResponse | null> {
  return getMyServiceRequests({
    active: true,
  });
}

/**
 * Get completed jobs
 */
export async function getCompletedJobs(): Promise<ServiceRequestsResponse | null> {
  return getMyServiceRequests({
    completed: true,
    sortBy: "serviceCompletedAt",
    sortOrder: "desc",
  });
}

/**
 * Get jobs pending PIN verification
 */
export async function getPendingPinVerification(): Promise<ServiceRequestsResponse | null> {
  return getMyServiceRequests({
    status: "completed",
    pinVerified: false,
  });
}

/**
 * Get upcoming jobs
 */
export async function getUpcomingJobs(): Promise<ServiceRequestsResponse | null> {
  return getMyServiceRequests({
    upcoming: true,
    sortBy: "scheduledDate",
    sortOrder: "asc",
  });
}

/**
 * Search jobs by customer name or service
 */
export async function searchJobs(
  searchTerm: string
): Promise<ServiceRequestsResponse | null> {
  return getMyServiceRequests({
    search: searchTerm,
  });
}

/**
 * Get this month's earnings
 */
export async function getMonthlyEarnings(): Promise<ServiceRequestsResponse | null> {
  return getMyServiceRequests({
    thisMonth: true,
    status: "completed",
  });
}

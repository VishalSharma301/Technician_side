// src/util/ApiService.ts
import axios, { AxiosError, AxiosRequestConfig } from 'axios';
import { Job } from '../constants/jobTypes';

const BASE_URL = 'https://st51mzlz-8080.inc1.devtunnels.ms/api'; // your backend URL

// Create an axios instance
const api = axios.create({
  baseURL: BASE_URL,
  timeout: 10000, // 10 seconds
  validateStatus: status => status >= 200 && status < 500,
});

// Request interceptor: log and inject correct Authorization header
api.interceptors.request.use(
  async (config: AxiosRequestConfig) => {
    // Retrieve token however you store it; here it's passed into fetchAssignedServices
    // so this is optional if you set headers in the call directly.
    console.log('➡️ Request Config:', {
      url: config.baseURL + config.url,
      method: config.method,
      headers: config.headers,
      params: config.params,
      data: config.data,
    });

    // Ensure correct header key spelling
    if (config.headers) {
      // If you want to set a default token here, uncomment:
      // const token = await getAuthToken();
      // config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  err => {
    console.error('❌ Request build error:', err);
    return Promise.reject(err);
  }
);

// Response interceptor: log responses and errors
api.interceptors.response.use(
  response => {
    console.log('✅ Response:', {
      url: response.config.url,
      status: response.status,
      data: response.data.data,
    });
    return response;
  },
  error => {
    console.error('❌ Response error:', {
      message: error.message,
      code: (error as AxiosError).code,
      status: (error as AxiosError).response?.status,
      data: (error as AxiosError).response?.data,
    });
    return Promise.reject(error);
  }
);

/**
 * Fetch assigned services for the technician with robust error handling.
 * @param token Bearer token
 * @param page Page number (default: 1)
 * @param limit Number of items per page (default: 20)
 * @returns The raw response data from the backend
 */
export async function fetchAssignedServices(
  token: string,
  page: number = 1,
  limit: number = 20
) {
  try {
    const response = await api.get('/technicians/my-requests', {
      params: { page, limit },
      headers: {
        // Correct header key
        Authorization: `Bearer ${token}`,
      },
    });

    // Handle 4xx client errors explicitly
    if (response.status >= 400) {
      const serverMsg = response.data?.message || response.statusText;
      throw new Error(`Client error ${response.status}: ${serverMsg}`);
    }

    // Return backend data directly
    const data : Job[] = response.data.data
    
    console.log('data : ', data.map(j => ({
         ...j,
    receivedAt: j.receivedAt ? new Date(j.receivedAt) : new Date(),
    expiresAt: j.expiresAt ? new Date(j.expiresAt) : new Date(Date.now() + 300000),
    startedAt: j.startedAt ? new Date(j.startedAt) : undefined,
    completedAt: j.completedAt ? new Date(j.completedAt) : undefined,
    })));
    return data.map(j => ({
         ...j,
    receivedAt: j.receivedAt ? new Date(j.receivedAt) : new Date(),
    expiresAt: j.expiresAt ? new Date(j.expiresAt) : new Date(Date.now() + 300000),
    startedAt: j.startedAt ? new Date(j.startedAt) : undefined,
    completedAt: j.completedAt ? new Date(j.completedAt) : undefined,
    }));
  } catch (err: any) {
    if (axios.isAxiosError(err)) {
      // Network error (no response)
      if (!err.response) {
        throw new Error('Network error: please check your connection or URL');
      }
      // Timeout
      if (err.code === 'ECONNABORTED') {
        throw new Error('Request timeout: server took too long to respond');
      }
      // Server or other HTTP errors
      const status = err.response.status;
      const serverMsg = err.response.data?.message || err.response.statusText;
      throw new Error(`Server returned ${status}: ${serverMsg}`);
    }
    // Unexpected error
    throw new Error(err.message || 'Unknown error occurred');
  }
}

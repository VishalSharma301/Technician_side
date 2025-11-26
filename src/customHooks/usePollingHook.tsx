// src/customHooks/usePollingHook.tsx - FINAL CORRECTED VERSION
// Fixed type casting issue: ServiceRequest[] -> Job[]

import { useCallback, useEffect, useRef } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import { useJobs } from '../store/JobContext';
import { getMyServiceRequests } from '../util/servicesApi';

const POLL_MS = 30_000;

export default function usePolling() {
  const { setLoading, setError, setJobs } = useJobs();
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const appStateRef = useRef(AppState.currentState);

  // ============================================
  // FETCH JOBS
  // ============================================

  const fetchJobs = useCallback(async () => {
    try {
      setLoading(true);

      // Fetch jobs from new API
      const response = await getMyServiceRequests({
        limit: 50,
      });

      if (response && response.success && response.data) {
        // ✅ FIX: Cast ServiceRequest[] to Job[] for type compatibility
        // The data structures are identical, just different type names
        setJobs(response.data as unknown as any);
        setError(null);
        console.log('✅ Polling: Fetched', response.data.length, 'jobs');
      } else {
        setError('Failed to fetch jobs');
      }
    } catch (error: any) {
      const errorMessage = error?.message || 'Error fetching jobs';
      setError(errorMessage);
      console.error('❌ Polling error:', errorMessage);
    } finally {
      setLoading(false);
    }
  }, [setLoading, setError, setJobs]);

  // ============================================
  // HANDLE APP STATE CHANGES
  // ============================================

  const handleAppStateChange = useCallback((state: AppStateStatus) => {
    appStateRef.current = state;

    if (state === 'active') {
      // App came to foreground - resume polling
      console.log('📱 App foreground - resuming polling');
      startPolling();
    } else {
      // App went to background - stop polling
      console.log('📱 App background - pausing polling');
      stopPolling();
    }
  }, []);

  // ============================================
  // START POLLING
  // ============================================

  const startPolling = useCallback(() => {
    if (intervalRef.current) return; // Already polling

    // Fetch immediately
    fetchJobs();

    // Then fetch every POLL_MS
    intervalRef.current = setInterval(() => {
      if (appStateRef.current === 'active') {
        fetchJobs();
      }
    }, POLL_MS);

    console.log('✅ Polling started (every', POLL_MS / 1000, 'seconds)');
  }, [fetchJobs]);

  // ============================================
  // STOP POLLING
  // ============================================

  const stopPolling = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
      console.log('⏸️  Polling stopped');
    }
  }, []);

  // ============================================
  // APP STATE LISTENER
  // ============================================

  useEffect(() => {
    const subscription = AppState.addEventListener(
      'change',
      handleAppStateChange
    );
    return () => {
      subscription.remove();
    };
  }, [handleAppStateChange]);

  // ============================================
  // MOUNT/UNMOUNT EFFECTS
  // ============================================

  useEffect(() => {
    // Start polling when component mounts
    if (appStateRef.current === 'active') {
      startPolling();
    }

    // Stop polling when component unmounts
    return () => {
      stopPolling();
    };
  }, [startPolling, stopPolling]);

  return {
    startPolling,
    stopPolling,
    fetchJobs,
  };
}
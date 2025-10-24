import {useCallback, useContext, useEffect, useRef} from 'react';
import {AppState, AppStateStatus} from 'react-native';
import * as Api from '../util/ApiService';
import { useJobs } from '../store/JobContext';
import { Job,  } from '../constants/jobTypes';
import { fetchAssignedServices } from '../util/servicesApi';
import { AuthContext } from '../store/AuthContext';

const POLL_MS = 30_000;

export default function usePolling() {
  const {setLoading, setError, addJob, updateStatus} = useJobs();
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const {token} = useContext(AuthContext)

  /* request wrapper */
  const fetchJobs = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetchAssignedServices(token);      // returns Job[]
      // console.log("fetched jobs:", res);
      
      res.forEach((j: Job) => addJob(j));
      setError(null);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }, [addJob, setError, setLoading]);

  /* start / stop on app state */
  useEffect(() => {
    const toggle = (state: AppStateStatus) => {
      const shouldRun = state === 'active';
      if (shouldRun && !intervalRef.current) {
        fetchJobs(); // immediate
        intervalRef.current = setInterval(fetchJobs, POLL_MS);
      } else if (!shouldRun && intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
    const sub = AppState.addEventListener('change', toggle);
    toggle(AppState.currentState);
    return () => {
      sub.remove();
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [fetchJobs]);

  /* expose manual trigger */
  return fetchJobs;
}

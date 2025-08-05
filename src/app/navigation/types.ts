// src/navigation/types.ts
import { Job, JobStatus } from '../../constants/jobTypes';

export type RootStackParamList = {
  Home        : undefined;
  JobDetails  : { job: Job };
  JobsScreen  : { defaultStatus: JobStatus };
};

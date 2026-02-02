import { api } from "./client";
import { Job } from "../constants/jobTypes";

export async function startInspection(jobId: string): Promise<Job> {
  const res = await api.post(
    `/api/technicians/jobs/${jobId}/inspection/start`
  );
  return res.data.job;
}


export async function completeInspection(
  jobId: string,
  findings: string,
  isServiceCorrect: boolean
): Promise<Job> {
  const res = await api.post(
    `/api/technicians/jobs/${jobId}/inspection/complete`,
    {
      findings,
      isServiceCorrect,
    }
  );
  return res.data.job;
}


export const verifyJobOtp = async (
  jobId: string,
  otp: string
) => {
  const { data } = await api.post(
    `/api/technicians/jobs/${jobId}/verify-otp`,
    { otp }
  );
  return data;
};
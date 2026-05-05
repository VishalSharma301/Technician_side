import axios from "axios";
import { BASE } from "./BASE_URL";

export const confirmSchedule = async (jobId: string, token: string) => {
  try {
    const { data } = await axios.post(
      `${BASE}/api/technicians/jobs/${jobId}/confirm-schedule`,
      {},
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        timeout: 10000,
      },
    );

    return data;
  } catch (error: any) {
    console.error(
      "Confirm Schedule API Error:",
      error?.response?.data || error,
    );
    throw error?.response?.data || error;
  }
};

export const rescheduleJob = async (
  jobId: string,
  token: string,
  newDate: string,
  newTimeSlot: string,
  reason: string,
) => {
  try {
    const { data } = await axios.post(
      `${BASE}/api/technicians/jobs/${jobId}/reschedule`,
      {
        newDate,
        newTimeSlot,
        reason,
      },
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        timeout: 10000,
      },
    );

    return data;
  } catch (error: any) {
    console.error("Reschedule Job API Error:", error?.response?.data || error);
    throw error?.response?.data || error;
  }
};

export const markOnWay = async (
  jobId: string,
  token: string,
  estimatedArrivalTime?: string,
) => {
  try {
    const { data } = await axios.post(
      `${BASE}/api/technicians/jobs/${jobId}/mark-on-way`,
      {
        estimatedArrivalTime,
      },
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        timeout: 10000,
      },
    );

    return data;
  } catch (error: any) {
    console.error("Mark On Way API Error:", error?.response?.data || error);
    throw error?.response?.data || error;
  }
};

export const markArrived = async (jobId: string, token: string) => {
  try {
    const { data } = await axios.post(
      `${BASE}/api/technicians/jobs/${jobId}/mark-arrived`,
      {},
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        timeout: 10000,
      },
    );

    return data;
  } catch (error: any) {
    console.error("Mark Arrived API Error:", error?.response?.data || error);
    throw error?.response?.data || error;
  }
};
export const markInProgress = async (jobId: string, token: string) => {
  try {
    const { data } = await axios.post(
      `${BASE}/api/technicians/jobs/${jobId}/in-progress`,
      {},
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        timeout: 10000,
      },
    );

    return data;
  } catch (error: any) {
    console.error("Mark In Progress API Error:", error?.response?.data || error);
    throw error?.response?.data || error;
  }
};
export const completeJob = async (jobId: string, token: string, otp: string) => {
  try {
    const { data } = await axios.post(
      `${BASE}/api/technicians/jobs/${jobId}/complete`,
      { otp, completionNotes: "Job Completed Successfully" },
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        timeout: 10000,
      }
    );

    return data;
  } catch (error: any) {
    const message =
      error?.response?.data?.message ||
      error?.response?.data?.error ||
      error?.message ||
      "Something went wrong";

    console.error("Complete Job API Error:", message);

    // 🔥 Always throw structured error
    throw {
      message,
      status: error?.response?.status,
      data: error?.response?.data,
    };
  }
};

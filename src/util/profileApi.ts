import axios, { AxiosError } from "axios";
import { BASE } from "./BASE_URL";

interface UserProfileData {
  firstName: string;
  lastName: string;
  phoneNumber: string;
  email: string;
}

const URL = `${BASE}/api`;



export const updateProfile = async (
  token: string,
  profileData: UserProfileData,
  id: string
): Promise<UserProfileData> => {
  try {
    const res = await axios.put(
      `${URL}/technicians/update-technician/${id}`,
      profileData,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        timeout: 10000, // ⏱️ safety timeout
      }
    );

    console.log("✅ Profile updated:", res.data);

    if (!res.data || !res.data.updatedTechnician) {
      throw new Error("❌ Invalid response: missing 'updatedUser' field.");
    }

    return res.data.updatedUser;
  } catch (err: any) {
    let message = "Unexpected error updating profile.";

    if (axios.isAxiosError(err)) {
      const axiosError = err as AxiosError;

      if (axiosError.response) {
        // Server responded but with error code
        const status = axiosError.response.status;
        const data = axiosError.response.data as { message?: string };

        console.error("❌ API error:", status, data);

        message =
          data?.message ||
          `Server error (${status}). Please try again later.`;
      } else if (axiosError.request) {
        // Request was sent but no response received
        console.error("❌ No response received:", axiosError.request);
        message = "No response from server. Check your internet connection.";
      } else {
        // Something went wrong setting up the request
        console.error("❌ Request setup error:", axiosError.message);
        message = axiosError.message;
      }
    } else {
      console.error("❌ Unknown error:", err);
      message = err.message || message;
    }

    throw new Error(message);
  }
};

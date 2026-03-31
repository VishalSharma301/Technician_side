import axios, { AxiosError } from "axios";
import { BASE } from "./BASE_URL";

interface UserProfileData {
  name : string
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
        timeout: 10000,
      }
    );

    console.log("✅ Profile updated:", res.data);

    if (!res.data || !res.data.technician) {
      throw new Error("Invalid response: missing 'technician'");
    }

    return res.data.technician;

  } catch (err: any) {
    let message = "Unexpected error updating profile.";

    if (axios.isAxiosError(err)) {
      if (err.response) {
        const status = err.response.status;
        const data = err.response.data as { message?: string };

        message =
          data?.message ||
          `Server error (${status}). Please try again later.`;
      } else if (err.request) {
        message = "No response from server. Check your internet.";
      } else {
        message = err.message;
      }
    }

    throw new Error(message);
  }
};
import axios from "axios";

const BASE_URL = "https://st51mzlz-8080.inc1.devtunnels.ms/api/";

export async function login(phoneNumber: string) {
  try {
    const response = await axios.post(`${BASE_URL}auth/technician/login`, {
      phoneNumber,
    });
    if (response.status === 200) {
      console.log("login response", response.status);
      return response.data;
    } else {
      console.warn("Unexpected response", response.status);
      return null;
    }
  } catch (error: any) {
    console.error("❌ Login error:", error.response?.data || error.message);
    return null;
  }
}


export async function verifyOtp(phoneNumber: string, otp: string) {
  try {
    const response = await axios.post(`${BASE_URL}auth/technician/login/verify-otp`, {
      phoneNumber,
      otp,
    });

    if (response.status === 200) {
      console.log("✅ OTP verification successful:", response.data);
      return response.data; // Could be user data or token
    } else {
      console.warn("⚠️ Unexpected status:", response.status);
      return null;
    }
  } catch (error: any) {
    console.error("❌ OTP verification error:", error.response?.data || error.message);
    return null;
  }
}


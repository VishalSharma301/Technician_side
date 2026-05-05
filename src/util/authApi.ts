import axios, { AxiosError } from "axios";
import { BASE } from "./BASE_URL";
import AsyncStorage from "@react-native-async-storage/async-storage";

type ApiErrorResponse = {
  message?: string;
  errors?: Record<string, string[]>;
};

let BASE_URL = `${BASE}/api/`;

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
    const response = await axios.post(
      `${BASE_URL}auth/technician/login/verify-otp`,
      {
        phoneNumber,
        otp,
      }
    );

    if (response.status === 200) {
      console.log("✅ OTP verification successful:", response.data);
      return response.data; // Could be user data or token
    } else {
      console.warn("⚠️ Unexpected status:", response.status);
      return null;
    }
  } catch (error: any) {
    console.error(
      "❌ OTP verification error:",
      error.response?.data || error.message
    );
    return null;
  }
}



export async function loginDirect() {
  try {
    const response = await axios.post(`${BASE_URL}auth/technician/login-without-otp`, {phoneNumber : "7087496301"});

    if (response.status === 200) {
      console.log("✅ OTP verification successful:", response.data);
      const token = response.data.token.token;
      const user = response.data.technician;
      console.log("Extracted Token:");
      await AsyncStorage.setItem("token", token);
      await AsyncStorage.setItem("profileData", JSON.stringify(user));
      return response.data; // user data or token
    } else {
      console.warn("⚠️ Unexpected status:", response.status);
      return null;
    }
  } catch (err) {
    const axiosError = err as AxiosError<ApiErrorResponse>;
    const status = axiosError.response?.status;
    const data = axiosError.response?.data;

    console.error(
      "❌ OTP verification error:",
      data?.message || axiosError.message || "Unknown error"
    );

    if (status) {
      console.error("HTTP Status:", status);
    }

    return null;
  }
}



type LoginWithEmailResponse = {
  success: boolean;
  token: {
    token: string;
  };
  technician: {
    _id: string;
    name: string;
    email: string;
    phoneNumber: string;
    provider: string;
    role: string;
  };
};

export async function loginWithEmail(
  email: string,
  password: string
): Promise<LoginWithEmailResponse> {
  try {
    const res = await axios.post(
      `${BASE_URL}auth/technician/login-with-email`,
      {
        email,
        password,
      }
    );

    return res.data;
  } catch (error: any) {
    console.error("Login with email failed:", error?.response?.data || error);

    throw new Error(
      error?.response?.data?.message || "Login failed. Please try again."
    );
  }
}
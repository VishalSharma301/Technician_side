import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { BASE } from "../util/BASE_URL";

export const api = axios.create({
  baseURL: BASE, 
  timeout: 15000,
});

api.interceptors.request.use(async (config) => {
  const token = await AsyncStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

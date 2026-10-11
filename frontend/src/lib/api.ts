import axios from "axios";
import { apiURL, isDemo } from "./config";
export const api = axios.create({ baseURL: apiURL, timeout: 30_000 });
api.interceptors.request.use((config) => {
  if (isDemo) throw new Error("Network requests are disabled in demo mode.");
  return config;
});
export function errorMessage(error: unknown): string {
  if (axios.isAxiosError(error))
    return typeof error.response?.data?.detail === "string"
      ? error.response.data.detail
      : "The backend is unavailable. Please retry.";
  return error instanceof Error
    ? error.message
    : "Something went wrong. Please retry.";
}

import axios from "axios";

const api = axios.create({
  baseURL: "https://backend-kubh.onrender.com/api",
  // baseURL: "http://127.0.0.1:8000/api",
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
});

api.interceptors.request.use((config) => {
  if (typeof window !== "undefined") {
    const token = window.localStorage.getItem("token");

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }

  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error?.response?.status;
    const requestUrl = error?.config?.url ?? "";
    const isAuthRequest =
      typeof requestUrl === "string" &&
      requestUrl.includes("/auth/login");

    if (
      typeof window !== "undefined" &&
      status === 401 &&
      !isAuthRequest
    ) {
      window.localStorage.removeItem("token");
      window.localStorage.removeItem("user");
      window.location.href = "/login";
    }

    return Promise.reject(error);
  },
);

export default api;
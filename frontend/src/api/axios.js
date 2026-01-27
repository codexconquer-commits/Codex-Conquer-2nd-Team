import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_BASE_URL,
});

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => Promise.reject(error)
);

// 🔥 RESPONSE INTERCEPTOR
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // ✅ Prevent infinite loops on 401 errors
    if (error.response?.status === 401) {
      // Check if already redirecting to prevent multiple redirects
      if (window.location.hash !== "#/login") {
        console.log("Unauthorized – redirecting to login");
        localStorage.removeItem("token");
        window.location.href = "/#/login";
      }
    }
    return Promise.reject(error);
  }
);

export default api;

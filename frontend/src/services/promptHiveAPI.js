import axios from "axios";
import { API_BASE_URL } from "../config";

const apiClient = axios.create({
  baseURL: API_BASE_URL, // Replace with your API's base URL
  headers: {
    "Content-Type": "application/json",
  },
});

export default apiClient;

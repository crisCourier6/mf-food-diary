import axios from 'axios';
// Create an Axios instance with the base URL from environment variables
const api = axios.create({
  baseURL: "http://192.168.100.6:8080"
});

export default api;
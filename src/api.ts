import axios from 'axios';
// Create an Axios instance with the base URL from environment variables
const api = axios.create({
  baseURL: "http://localhost:8081/api/v1"
});

export default api;
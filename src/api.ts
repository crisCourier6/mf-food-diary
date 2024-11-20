import axios from 'axios';
// Create an Axios instance with the base URL from environment variables
const api = axios.create({
  baseURL: `${process.env.REACT_APP_GATEWAY_URL}`
  // baseURL: "http://localhost:8081/api/v1"
});

export default api;
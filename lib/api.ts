import axios from 'axios';

const api = axios.create({
  baseURL: 'http://192.168.1.40:5000/api',  // Change localhost if testing on physical device
});

export default api;


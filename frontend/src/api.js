import axios from 'axios';

const api = axios.create({
  baseURL: 'https://tms.up.school/api',
});

export default api;

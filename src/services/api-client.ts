import axios from 'axios';
import { config } from '@/config';

const apiClient = axios.create({
    baseURL: config.apiUrl,
    timeout: 30000,
    withCredentials: true,
    headers: {
        'Content-Type': 'application/json',
    },
});

export default apiClient;

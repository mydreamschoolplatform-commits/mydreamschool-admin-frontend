import axios from 'axios';

import { API_BASE_URL } from './config';

const client = axios.create({
    baseURL: API_BASE_URL,
});

// Add a request interceptor to include the auth token
client.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('adminToken');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

import { showToast } from '../utils/toast';

client.interceptors.response.use(
    (response) => response,
    (error) => {
        const status = error.response?.status;
        const message = error.response?.data?.message || 'A network error occurred';

        if (status === 401) {
            localStorage.removeItem('adminToken');
            showToast('Session expired. Please log in again.', 'error');
            if (!window.location.pathname.includes('/login')) {
                window.location.href = '/login';
            }
        } else if (status >= 400 && status < 500) {
            if (!window.location.pathname.includes('/login')) {
                showToast(message, 'error');
            } else if (status !== 401 && status !== 400 && status !== 404) {
                showToast(message, 'error');
            }
        } else if (status >= 500) {
            showToast('Server error. Please try again later.', 'error');
        } else if (!error.response && error.message !== 'canceled') {
            showToast('Network error. Please check your connection.', 'error');
        }
        return Promise.reject(error);
    }
);

export const downloadFile = async (url, filename) => {
    try {
        const response = await client.get(url, { responseType: 'blob' });
        const href = URL.createObjectURL(response.data);
        const link = document.createElement('a');
        link.href = href;
        link.setAttribute('download', filename);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(href);
    } catch (err) {
        console.error("Download failed:", err);
        alert("Failed to download file. Please try again.");
    }
};

export default client;

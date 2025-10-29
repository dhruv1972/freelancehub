// Simple axios wrapper used throughout the client
// baseURL comes from VITE_API_BASE_URL so we can switch between dev/prod easily
import axios from 'axios';

// Use deployed backend URL
const baseURL = 'https://freelancehub-1-y9d7.onrender.com/api';
console.log('Setting API Base URL to:', baseURL);

export const api = axios.create({
    baseURL: baseURL,
    headers: { 'Content-Type': 'application/json' },
});

// Helper: clone the client with a dev-only header so backend knows who we are
export function withUser(email: string) {
    return api.create({ headers: { 'x-user-email': email } });
}



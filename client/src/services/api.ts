// Simple axios wrapper used throughout the client
// baseURL comes from VITE_API_BASE_URL so we can switch between dev/prod easily
import axios from 'axios';

export const api = axios.create({
    baseURL: import.meta.env.VITE_API_BASE_URL,
    headers: { 'Content-Type': 'application/json' },
});

// Helper: clone the client with a dev-only header so backend knows who we are
export function withUser(email: string) {
    return api.create({ headers: { 'x-user-email': email } });
}



import { create } from 'zustand';

export interface User {
    id: string;
    email: string;
    full_name: string;
    role: string;
    currency?: string;
    theme?: string;
}

interface AuthState {
    user: User | null;
    token: string | null;
    refreshToken: string | null;
    isAuthenticated: boolean;
    login: (token: string, refreshToken: string, user: User) => void;
    logout: () => void;
    setToken: (token: string) => void;
}

export const useAuthStore = create<AuthState>((set) => ({
    user: JSON.parse(localStorage.getItem('user') || 'null'),
    token: localStorage.getItem('token') || null,
    refreshToken: localStorage.getItem('refresh_token') || null,
    isAuthenticated: !!localStorage.getItem('token'),
    login: (token, refreshToken, user) => {
        localStorage.setItem('token', token);
        localStorage.setItem('refresh_token', refreshToken);
        localStorage.setItem('user', JSON.stringify(user));
        set({ token, refreshToken, user, isAuthenticated: true });
    },
    logout: () => {
        localStorage.removeItem('token');
        localStorage.removeItem('refresh_token');
        localStorage.removeItem('user');
        set({ token: null, refreshToken: null, user: null, isAuthenticated: false });
    },
    setToken: (token) => {
        localStorage.setItem('token', token);
        set({ token });
    }
}));


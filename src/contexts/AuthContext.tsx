import React, {createContext, useContext, useEffect, useState} from 'react';
import axios from 'axios';
import {useNavigate} from 'react-router';
import {BASE_API_URL} from "../config.ts";
import { apiClient } from '../client';

interface User {
    login: string;
    is_active: boolean;
    rights_by_goals: Record<string, string[]>;
}

interface AuthContextType {
    user: User | null;
    token: string | null;
    login: (credentials: { username: string; password: string }, rememberMe?: boolean) => Promise<void>;
    logout: () => void;
    isAuthenticated: boolean;
    loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};

export const AuthProvider = ({children}: { children: React.ReactNode }) => {
    const [user, setUser] = useState<User | null>(null);
    const [token, setToken] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    const getUserIp = async (): Promise<string> => {
        try {
            const response = await axios.get('https://api.ipify.org?format=json');
            return response.data.ip;
        } catch (error) {
            console.error('Failed to get client IP:', error);
            return '';
        }
    };

    useEffect(() => {
        const savedToken = sessionStorage.getItem('auth_token');
        
        const handleReturnUrl = () => {
            const urlParams = new URLSearchParams(window.location.search);
            const returnUrl = urlParams.get('returnUrl');
            if (returnUrl && !savedToken) {
                sessionStorage.setItem('return_url', returnUrl);
            }
        };
        handleReturnUrl();

        const initAuth = async () => {
            if (savedToken) {
                try {
                    setToken(savedToken);
                    await fetchUser(savedToken);
                } catch (error) {
                    sessionStorage.removeItem('auth_token');
                    setToken(null);
                    setUser(null);
                }
            }
            setLoading(false);
        };
        initAuth();
    }, []);

    const fetchUser = async (token: string) => {
        try {
            const response = await apiClient.get<User>(`${BASE_API_URL}/auth/me`, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });
            setUser(response.data);
        } catch (error) {
            console.error('Failed to fetch user:', error);
            throw error;
        }
    };

    const login = async (credentials: { username: string; password: string }, rememberMe: boolean = false) => {
        try {
            const formData = new URLSearchParams({
                username: credentials.username,
                password: credentials.password,
            });

            if (rememberMe) {
                formData.append('scope', 'long');
                const userIp = await getUserIp();
                formData.append('user_ip', userIp);
            }

            const response = await apiClient.post(
                `${BASE_API_URL}/auth/token`,
                formData,
                {
                    headers: {
                        'Content-Type': 'application/x-www-form-urlencoded',
                    },
                }
            );

            const {access_token} = response.data;

            // Сохраняем токен
            sessionStorage.setItem('auth_token', access_token);
            setToken(access_token);

            // Загружаем данные пользователя
            await fetchUser(access_token);

            const returnUrl = sessionStorage.getItem('return_url');
            if (returnUrl) {
                sessionStorage.removeItem('return_url');
                navigate(returnUrl);
            } else {
                navigate('/');
            }
        } catch (error) {
            console.error('Login failed:', error);
            throw error;
        }
    };

    const logout = () => {
        sessionStorage.removeItem('auth_token');
        sessionStorage.removeItem('return_url');
        setToken(null);
        setUser(null);
        navigate('/login');
    };

    const isAuthenticated = !!user;

    return (
        <AuthContext.Provider
            value={{
                user,
                token,
                login,
                logout,
                isAuthenticated,
                loading,
            }}
        >
            {children}
        </AuthContext.Provider>
    );
};
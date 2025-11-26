import React, {createContext, useContext, useEffect, useState} from 'react';
import axios from 'axios';
import {useNavigate} from 'react-router';
import {BASE_API_URL} from "../config.ts";

interface User {
    login: string;
    is_active: boolean;
    rights_by_goals: Record<string, string[]>;
}

interface AuthContextType {
    user: User | null;
    token: string | null;
    login: (credentials: { username: string; password: string }) => Promise<void>;
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

    // При запуске проверяем, есть ли токен в sessionStorage
    useEffect(() => {
        const savedToken = sessionStorage.getItem('auth_token');
        if (savedToken) {
            setToken(savedToken);
            // Загружаем данные пользователя по токену
            fetchUser(savedToken).catch(() => {
                // Если токен невалидный — очищаем сессию
                sessionStorage.removeItem('auth_token');
                setToken(null);
                setUser(null);
            });
        }
        setLoading(false);
    }, []);

    const fetchUser = async (token: string) => {
        try {
            const response = await axios.get<User>(`${BASE_API_URL}/auth/me`, {
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

    const login = async (credentials: { username: string; password: string }) => {
        try {
            const response = await axios.post(
                `${BASE_API_URL}/auth/token`,
                new URLSearchParams({
                    username: credentials.username,
                    password: credentials.password,
                }),
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

            navigate('/');
        } catch (error) {
            console.error('Login failed:', error);
            throw error;
        }
    };

    const logout = () => {
        sessionStorage.removeItem('auth_token');
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
import { createContext } from 'react';

export interface User {
  id: number;
  login: string;
  is_active: boolean;
  rights_by_goals: Record<string, string[]>;
}

export interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (
    credentials: { username: string; password: string },
    rememberMe?: boolean
  ) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
  loading: boolean;
}

// ✅ Экспортируем только контекст и типы — никаких компонентов
export const AuthContext = createContext<AuthContextType | undefined>(undefined);

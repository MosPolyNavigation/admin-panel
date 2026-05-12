import axios, {
  type AxiosInstance,
  type InternalAxiosRequestConfig,
  type AxiosError,
  type AxiosRequestConfig,
} from 'axios';
import { BASE_API_URL } from '../config';

interface CustomRequestConfig extends InternalAxiosRequestConfig {
  _retry?: boolean;
}

class ApiClient {
  private client: AxiosInstance;
  private isRefreshing = false;
  private refreshSubscribers: Array<{
    resolve: (token: string) => void;
    reject: (error: unknown) => void;
  }> = [];

  constructor() {
    this.client = axios.create({
      baseURL: BASE_API_URL,
      withCredentials: true,
    });
    this.setupInterceptors();
  }

  private setupInterceptors() {
    // 🔹 Request Interceptor
    this.client.interceptors.request.use(
      async (config: CustomRequestConfig) => {
        const token = sessionStorage.getItem('auth_token');
        if (token) {
          // Превентивное обновление, если токен скоро протухнет
          if (this.isTokenExpiringSoon(token)) {
            await this.refreshToken();
          }
          const currentToken = sessionStorage.getItem('auth_token');
          if (currentToken && config.headers) {
            config.headers.Authorization = `Bearer ${currentToken}`;
          }
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    // 🔹 Response Interceptor
    this.client.interceptors.response.use(
      (response) => response,
      async (error: AxiosError) => {
        const originalRequest = error.config as CustomRequestConfig;
        if (error.response?.status === 401 && !originalRequest._retry) {
          originalRequest._retry = true;
          try {
            await this.refreshToken();
            const newToken = sessionStorage.getItem('auth_token');
            if (newToken && originalRequest.headers) {
              originalRequest.headers.Authorization = `Bearer ${newToken}`;
            }
            return this.client(originalRequest);
          } catch (refreshError) {
            this.handleRefreshFailure();
            return Promise.reject(refreshError);
          }
        }
        return Promise.reject(error);
      }
    );
  }

  private isTokenExpiringSoon(token: string): boolean {
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const exp = payload.exp * 1000;
      return exp - Date.now() < 60_000; // < 60 секунд до истечения
    } catch {
      return true; // Если токен битый, считаем что пора обновлять
    }
  }

  private async refreshToken(): Promise<string> {
    if (this.isRefreshing) {
      // Ожидающие запросы ставят свои промисы в очередь
      return new Promise((resolve, reject) => {
        this.refreshSubscribers.push({ resolve, reject });
      });
    }

    this.isRefreshing = true;

    try {
      const response = await axios.post(
        `${BASE_API_URL}/auth/refresh`,
        {},
        { withCredentials: true }
      );
      const { access_token } = response.data;
      if (access_token) {
        sessionStorage.setItem('auth_token', access_token);
        this.notifySubscribers(access_token, true);
        return access_token;
      }
      throw new Error('No access token received');
    } catch (error) {
      this.notifySubscribers(null, false);
      throw error;
    } finally {
      this.isRefreshing = false;
    }
  }

  private notifySubscribers(token: string | null, success: boolean) {
    this.refreshSubscribers.forEach(({ resolve, reject }) => {
      if (success && token) resolve(token);
      else reject(new Error('Token refresh failed'));
    });
    this.refreshSubscribers = [];
  }

  private handleRefreshFailure() {
    sessionStorage.removeItem('auth_token');
    const returnUrl = encodeURIComponent(window.location.pathname + window.location.search);
    window.location.href = `/admin/login?returnUrl=${returnUrl}`;
  }

  // 🌐 Публичное API
  public getInstance(): AxiosInstance {
    return this.client;
  }

  // Хелпер для REST (типизированный)
  public rest = {
    get: <T>(url: string, config?: Partial<AxiosRequestConfig>) => this.client.get<T>(url, config),
    post: <T>(url: string, data?: unknown, config?: Partial<AxiosRequestConfig>) =>
      this.client.post<T>(url, data, config),
    patch: <T>(url: string, data?: unknown, config?: Partial<AxiosRequestConfig>) =>
      this.client.patch<T>(url, data, config),
    put: <T>(url: string, data?: unknown, config?: Partial<AxiosRequestConfig>) =>
      this.client.put<T>(url, data, config),
    delete: <T>(url: string, config?: Partial<AxiosRequestConfig>) =>
      this.client.delete<T>(url, config),
  };

  // Хелпер для GraphQL
  public graphql = {
    post: <T>(
      query: string,
      variables?: Record<string, unknown>,
      config?: Partial<AxiosRequestConfig> // ✅ Новый параметр
    ) =>
      this.client.post<T>(
        '/graphql',
        { query, variables },
        {
          headers: { 'Content-Type': 'application/json', ...config?.headers }, // ✅ Мерджим заголовки
          ...config, // ✅ Пробрасываем signal, timeout, onUploadProgress и т.д.
        }
      ),
  };
}

const apiInstance = new ApiClient();

// Экспортируем основной инстанс и удобные обёртки
export const apiClient = apiInstance.getInstance();
export const restClient = apiInstance.rest;
export const graphqlClient = apiInstance.graphql;

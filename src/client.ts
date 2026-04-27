import axios, { type AxiosInstance, type InternalAxiosRequestConfig, type AxiosError } from 'axios';
import { BASE_API_URL } from './config';

interface CustomRequestConfig extends InternalAxiosRequestConfig {
  _retry?: boolean;
}

interface QueuedRequest {
  resolve: (value: unknown) => void;
  reject: (reason?: unknown) => void;
  config: CustomRequestConfig;
}

class ApiClient {
  private client: AxiosInstance;
  private isRefreshing = false;
  private refreshSubscribers: QueuedRequest[] = [];

  constructor() {
    this.client = axios.create({
      baseURL: BASE_API_URL,
      withCredentials: true,
    });
    this.setupInterceptors();
  }

  private setupInterceptors() {
    this.client.interceptors.request.use(
      async (config: CustomRequestConfig) => {
        const token = sessionStorage.getItem('auth_token');
        if (token && this.isTokenExpiringSoon(token)) {
          await this.refreshToken();
          const newToken = sessionStorage.getItem('auth_token');
          if (newToken && config.headers) {
            config.headers.Authorization = `Bearer ${newToken}`;
          }
        } else if (token && config.headers) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    this.client.interceptors.response.use(
      (response) => response,
      async (error: AxiosError) => {
        const originalRequest = error.config as CustomRequestConfig;
        if (error.response?.status === 401 && !originalRequest._retry) {
          originalRequest._retry = true;
          try {
            const newToken = await this.refreshToken();
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
      return exp - Date.now() < 60000;
    } catch {
      return true;
    }
  }

  private async refreshToken(): Promise<string> {
    if (this.isRefreshing) {
      return new Promise((resolve, reject) => {
        this.refreshSubscribers.push({
          resolve: resolve as (value: unknown) => void,
          reject,
          config: {} as CustomRequestConfig,
        });
      }) as Promise<string>;
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
        this.onRefreshSuccess(access_token);
        return access_token;
      }
      throw new Error('No access token received');
    } catch (error) {
      this.onRefreshFailure();
      throw error;
    } finally {
      this.isRefreshing = false;
    }
  }

  private onRefreshSuccess(token: string): void {
    this.refreshSubscribers.forEach(({ resolve, config }) => {
      if (config.headers) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      resolve(token);
    });
    this.refreshSubscribers = [];
  }

  private onRefreshFailure(): void {
    this.refreshSubscribers.forEach(({ reject }) => {
      reject(new Error('Refresh failed'));
    });
    this.refreshSubscribers = [];
  }

  private handleRefreshFailure(): void {
    sessionStorage.removeItem('auth_token');
    const returnUrl = encodeURIComponent(window.location.pathname + window.location.search);
    window.location.href = `/login?returnUrl=${returnUrl}`;
  }

  public getClient(): AxiosInstance {
    return this.client;
  }
}

export const apiClient = new ApiClient().getClient();

import axios from 'axios';
import { restClient } from './client';
import type { AllowedPermissionsResponse } from './types';

export const getAllowedPermissions = async (
  signal?: AbortSignal
): Promise<{ data: AllowedPermissionsResponse | null; error: string | null }> => {
  try {
    const response = await restClient.get<AllowedPermissionsResponse>('/auth/allowed_permissions', {
      signal,
    });

    return { data: response.data, error: null };
  } catch (err) {
    if (axios.isAxiosError(err)) {
      if (err.response?.status === 401) {
        return { data: null, error: 'Требуется аутентификация' };
      }
      if (err.response?.status === 403) {
        return { data: null, error: 'Недостаточно прав (требуется roles:view)' };
      }
    }
    return {
      data: null,
      error: err instanceof Error ? err.message : 'Ошибка загрузки разрешений',
    };
  }
};

export const revokeRefreshToken = async (
  jti: string,
  signal?: AbortSignal
): Promise<{ ok: boolean; error: string | null }> => {
  try {
    await restClient.post<{ status: string }>(
      '/auth/revoke',
      { jti },
      { signal, headers: { 'Content-Type': 'application/json' } }
    );
    return { ok: true, error: null };
  } catch (err) {
    if (axios.isAxiosError(err)) {
      const msg = err.response?.data?.detail || err.response?.data?.message || err.message;
      return { ok: false, error: msg };
    }
    return { ok: false, error: err instanceof Error ? err.message : 'Ошибка завершения сессии' };
  }
};

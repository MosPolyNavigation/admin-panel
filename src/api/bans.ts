import { restClient } from './client.ts';
import type { BanInfo, BanListResponse, UnbanResponse } from './types.ts';
import axios from 'axios';

export const getBannedUsers = async (
  page: number = 1,
  size: number = 100,
  signal?: AbortSignal
): Promise<BanListResponse> => {
  const response = await restClient.get<BanListResponse>(`/admin/review-bans`, {
    params: { page, size },
    signal,
  });
  return response.data;
};

export const getBanInfo = async (
  user_id: string,
  signal?: AbortSignal
): Promise<BanInfo | null> => {
  try {
    const response = await restClient.get<BanInfo>(`/admin/review-bans/${user_id}`, { signal });
    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error) && error.response?.status === 404) {
      return null;
    }
    throw error;
  }
};

export const unbanUser = async (
  user_id: string,
  reason?: string,
  signal?: AbortSignal
): Promise<UnbanResponse> => {
  const response = await restClient.post<UnbanResponse>(
    `/admin/review-bans/${user_id}/unban`,
    reason ? { reason } : {},
    {
      headers: {
        'Content-Type': 'application/json',
      },
      signal,
    }
  );
  return response.data;
};

import { restClient } from './client.ts';
import { BASE_API_URL } from '../config.ts';
import type { BanInfo, BanListResponse, UnbanResponse } from './types.ts';
import axios from 'axios';

export const getBannedUsers = async (
  token: string,
  page: number = 1,
  size: number = 100,
  signal?: AbortSignal
): Promise<BanListResponse> => {
  const response = await restClient.get(`${BASE_API_URL}/admin/review-bans`, {
    params: { page, size },
    headers: {
      Authorization: `Bearer ${token}`,
    },
    signal,
  });
  return response.data;
};

export const getBanInfo = async (
  token: string,
  user_id: string,
  signal?: AbortSignal
): Promise<BanInfo | null> => {
  try {
    const response = await restClient.get(`${BASE_API_URL}/admin/review-bans/${user_id}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
      signal,
    });
    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error) && error.response?.status === 404) {
      return null;
    }
    throw error;
  }
};

export const unbanUser = async (
  token: string,
  user_id: string,
  reason?: string,
  signal?: AbortSignal
): Promise<UnbanResponse> => {
  const response = await restClient.post(
    `${BASE_API_URL}/admin/review-bans/${user_id}/unban`,
    reason ? { reason } : {},
    {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      signal,
    }
  );
  return response.data;
};

import axios from 'axios';
import { BASE_API_URL } from './config.ts';

export interface EndpointStatistics {
  allVisits: number;
  period: string;
  uniqueVisitors: number;
  visitorCount: number;

  [key: string]: string | number | Date | null | undefined;
}

export interface GqlResponse {
  data: {
    endpointStatistics: EndpointStatistics[];
  };
}

export interface Review {
  id: number | string;
  problemId: string;
  creationDate: string;
  text: string;
  imageName: string | null;
  statusId: number;
}

export interface ReviewStatus {
  id: number;
  name: string;
}

export interface ReviewsGqlResponse {
  data: {
    reviews: Review[];
  };
}

export interface ReviewStatusesGqlResponse {
  data: {
    reviewStatuses: ReviewStatus[];
  };
}

export interface ReviewStatus {
  id: number;
  name: string;
}

export interface SetReviewStatusRespose {
  message: string;
  review_id: number;
  status_id: number;
  status_name: string;
}

export interface BatchGqlResponse {
  data: {
    site: EndpointStatistics[];
    auds: EndpointStatistics[];
    ways: EndpointStatistics[];
    plans: EndpointStatistics[];
  };
}

export const get_stat = async (
  endpoint: string,
  normalizedStartDate: string,
  normalizedEndDate: string,
  token: string
) => {
  return await axios.post<GqlResponse>(
    `${BASE_API_URL}/graphql`,
    {
      query: `{
    endpointStatistics(endpoint: "${endpoint}", endDate: "${normalizedEndDate}", startDate: "${normalizedStartDate}") {
        allVisits
        period
        uniqueVisitors
        visitorCount
    }
}`,
    },
    {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
    }
  );
};

export const getReviews = async (token: string): Promise<Review[]> => {
  const response = await axios.post<ReviewsGqlResponse>(
    `${BASE_API_URL}/graphql`,
    {
      query: `{
                reviews {
                    id,
                    problemId,
                    creationDate,
                    text,
                    imageName,
                    statusId
                }
            }`,
    },
    {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
    }
  );
  return response.data.data.reviews;
};

export const getReview = async (token: string, id: string): Promise<Review[]> => {
  const response = await axios.post<ReviewsGqlResponse>(
    `${BASE_API_URL}/graphql`,
    {
      query: `{
                reviews (reviewId: ${id}) {
                    id,
                    problemId,
                    creationDate,
                    text,
                    imageName,
                    statusId
                }
            }`,
    },
    {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
    }
  );
  return response.data.data.reviews;
};

export const getReviewStatuses = async (token: string): Promise<ReviewStatus[]> => {
  try {
    const response = await axios.post<ReviewStatusesGqlResponse>(
      `${BASE_API_URL}/graphql`,
      {
        query: `{
                    reviewStatuses {
                        id, name
                    }
                }`,
      },
      {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      }
    );
    return response.data.data.reviewStatuses;
  } catch (error) {
    console.error('Ошибка загрузки статусов:', error);
    return [];
  }
};

export const getReviewImageUrl = (imageName: string): string => {
  return `${BASE_API_URL}/review/image/${imageName}`;
};

export const setReviewStatus = async (
  review_id: string,
  status_id: string,
  token: string
): Promise<SetReviewStatusRespose | null> => {
  try {
    const response = await axios.patch<SetReviewStatusRespose>(
      `${BASE_API_URL}/review/${review_id}/status`,
      `status_id=${status_id}`,
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          Authorization: `Bearer ${token}`,
        },
      }
    );
    return response.data;
  } catch (error) {
    console.error('Ошибка загрузки статусов:', error);
    return null;
  }
};

export type DateFilterType = 'byDate' | 'byMonth' | 'byYear';

export const get_all_stats = async (
  filterType: DateFilterType,
  startDate: string,
  endDate: string,
  token: string,
  signal?: AbortSignal
) => {
  try {
    const filterString = `${filterType}: {start: "${startDate}", end: "${endDate}"}`;

    const query = `{
            site: endpointStatistics(endpoint: "site", ${filterString}) {
                allVisits
                period
                uniqueVisitors
                visitorCount
            }
            auds: endpointStatistics(endpoint: "auds", ${filterString}) {
                allVisits
                period
                uniqueVisitors
                visitorCount
            }
            ways: endpointStatistics(endpoint: "ways", ${filterString}) {
                allVisits
                period
                uniqueVisitors
                visitorCount
            }
            plans: endpointStatistics(endpoint: "plans", ${filterString}) {
                allVisits
                period
                uniqueVisitors
                visitorCount
            }
        }`;

    const response = await axios.post<BatchGqlResponse>(
      `${BASE_API_URL}/graphql`,
      { query },
      {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        signal,
      }
    );

    return response;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      console.error('Ошибка API:', {
        status: error.response?.status,
        data: error.response?.data,
        headers: error.response?.headers,
      });
    }
    throw error;
  }
};

export const getReviewsBatch = async (token: string, signal?: AbortSignal) => {
  const query = `{
        status1: reviews(status_id: 1) {
            id
            problemId
            creationDate
            text
            status_id
            imageName
        }
        status2: reviews(status_id: 2) {
            id
            problemId
            creationDate
            text
            status_id
            imageName
        }
        status3: reviews(status_id: 3) {
            id
            problemId
            creationDate
            text
            status_id
            imageName
        }
        status4: reviews(status_id: 4) {
            id
            problemId
            creationDate
            text
            status_id
            imageName
        }
        status5: reviews(status_id: 5) {
            id
            problemId
            creationDate
            text
            status_id
            imageName
        }
        status6: reviews(status_id: 6) {
            id
            problemId
            creationDate
            text
            status_id
            imageName
        }
        status7: reviews(status_id: 7) {
            id
            problemId
            creationDate
            text
            status_id
            imageName
        }
    }`;

  const response = await axios.post<{
    data: {
      status1: Review[];
      status2: Review[];
      status3: Review[];
      status4: Review[];
      status5: Review[];
      status6: Review[];
      status7: Review[];
    };
  }>(
    `${BASE_API_URL}/graphql`,
    { query },
    {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      signal,
    }
  );

  return response.data.data;
};

export interface BanInfo {
  user_id: string;
  banned: boolean;
  ban_reason: string | null;
  ban_timestamp: string | null;
  violation_count: number;
  requests_count: number;
  last_request: string | null;
}

export interface BanListResponse {
  items: BanInfo[];
  total: number;
  page: number;
  size: number;
  pages: number;
}

export interface UnbanRequest {
  reason?: string;
}

export interface UnbanResponse {
  status: string;
}

// Получить список забаненных пользователей
export const getBannedUsers = async (
  token: string,
  page: number = 1,
  size: number = 100,
  signal?: AbortSignal
): Promise<BanListResponse> => {
  const response = await axios.get<BanListResponse>(`${BASE_API_URL}/admin/review-bans`, {
    params: { page, size },
    headers: {
      Authorization: `Bearer ${token}`,
    },
    signal,
  });
  return response.data;
};

// Получить информацию о бане конкретного пользователя
export const getBanInfo = async (
  token: string,
  user_id: string,
  signal?: AbortSignal
): Promise<BanInfo | null> => {
  try {
    const response = await axios.get<BanInfo>(`${BASE_API_URL}/admin/review-bans/${user_id}`, {
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

// Разбанить пользователя
export const unbanUser = async (
  token: string,
  user_id: string,
  reason?: string
): Promise<UnbanResponse> => {
  const response = await axios.post<UnbanResponse>(
    `${BASE_API_URL}/admin/review-bans/${user_id}/unban`,
    reason ? { reason } : {},
    {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
    }
  );
  return response.data;
};

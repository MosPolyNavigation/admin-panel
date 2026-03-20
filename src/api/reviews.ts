import { graphqlClient, restClient } from './client.ts';
import { BASE_API_URL } from '../config.ts';
import type { GqlResponse, Review, ReviewStatus, SetReviewStatusResponse } from './types.ts';

export const getReviews = async (token: string, signal?: AbortSignal): Promise<Review[]> => {
  const query = `{ reviews { id, problemId, creationDate, text, imageName, statusId } }`;

  const response = await graphqlClient.post<GqlResponse<{ reviews: Review[] }>>(
    '/graphql',
    { query },
    {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      signal,
    }
  );

  return response.data.data.reviews;
};

export const getReview = async (
  token: string,
  id: string,
  signal?: AbortSignal
): Promise<Review[]> => {
  const query = `{ reviews (reviewId: ${id}) { id, problemId, creationDate, text, imageName, statusId } }`;

  const response = await graphqlClient.post<GqlResponse<{ reviews: Review[] }>>(
    '/graphql',
    { query },
    {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      signal,
    }
  );

  return response.data.data.reviews;
};

export const getReviewStatuses = async (
  token: string,
  signal?: AbortSignal
): Promise<ReviewStatus[]> => {
  try {
    const query = `{ reviewStatuses { id, name } }`;

    const response = await graphqlClient.post<GqlResponse<{ reviewStatuses: ReviewStatus[] }>>(
      '/graphql',
      { query },
      {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        signal,
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
  token: string,
  signal?: AbortSignal
): Promise<SetReviewStatusResponse | null> => {
  try {
    const response = await restClient.patch(
      `${BASE_API_URL}/review/${review_id}/status`,
      `status_id=${status_id}`,
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          Authorization: `Bearer ${token}`,
        },
        signal,
      }
    );
    return response.data;
  } catch (error) {
    console.error('Ошибка установки статуса:', error);
    return null;
  }
};

export const getReviewsBatch = async (token: string, signal?: AbortSignal) => {
  const query = `{ 
    status1: reviews(status_id: 1) { id problemId creationDate text status_id imageName } 
    status2: reviews(status_id: 2) { id problemId creationDate text status_id imageName } 
    status3: reviews(status_id: 3) { id problemId creationDate text status_id imageName } 
    status4: reviews(status_id: 4) { id problemId creationDate text status_id imageName } 
    status5: reviews(status_id: 5) { id problemId creationDate text status_id imageName } 
    status6: reviews(status_id: 6) { id problemId creationDate text status_id imageName } 
    status7: reviews(status_id: 7) { id problemId creationDate text status_id imageName } 
  }`;

  const response = await graphqlClient.post<{
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
    '/graphql',
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

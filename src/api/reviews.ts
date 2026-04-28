import { graphqlClient, restClient } from './client.ts';
import type { GqlResponse, Review, ReviewStatus, SetReviewStatusResponse } from './types.ts';

export const getReviews = async (signal?: AbortSignal): Promise<Review[]> => {
  const query = `{ reviews { id, problemId, creationDate, text, imageName, statusId } }`;

  const response = await graphqlClient.post<GqlResponse<{ reviews: Review[] }>>(query, undefined, {
    signal,
  });

  return response.data.data.reviews;
};

export const getReview = async (id: string, signal?: AbortSignal): Promise<Review[]> => {
  const query = `{ reviews (reviewId: ${id}) { id, problemId, creationDate, text, imageName, statusId } }`;

  const response = await graphqlClient.post<GqlResponse<{ reviews: Review[] }>>(query, undefined, {
    signal,
  });

  return response.data.data.reviews;
};

export const getReviewStatuses = async (signal?: AbortSignal): Promise<ReviewStatus[]> => {
  try {
    const query = `{ reviewStatuses { id, name } }`;

    const response = await graphqlClient.post<GqlResponse<{ reviewStatuses: ReviewStatus[] }>>(
      query,
      undefined,
      {
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
  return `/review/image/${imageName}`;
};

export const setReviewStatus = async (
  review_id: string,
  status_id: string,
  signal?: AbortSignal
): Promise<SetReviewStatusResponse | null> => {
  try {
    const response = await restClient.patch<SetReviewStatusResponse>(
      `/review/${review_id}/status`,
      `status_id=${status_id}`,
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
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

export const getReviewsBatch = async (signal?: AbortSignal) => {
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
  }>(query, undefined, {
    signal,
  });

  return response.data.data;
};

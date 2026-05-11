import { buildFilterParts } from '../utils.ts';
import { graphqlClient, restClient } from './client.ts';
import type { GqlResponse, Review, ReviewStatus, SetReviewStatusResponse } from './types.ts';

const REVIEW_FIELDS = 'id clientId problemId statusId text imageName creationDate';

export const getReviews = async (
  filters?: { reviewStatusId?: number; clientId?: number; problemId?: string },
  pagination?: { page?: number; pageSize?: number },
  signal?: AbortSignal
): Promise<{ reviews: Review[]; error: string | null }> => {
  const filterParts = buildFilterParts(filters ?? {});

  const args: string[] = [];
  if (filterParts.length) {
    args.push(`filter: {${filterParts.join(', ')}}`);
  }

  if (pagination?.page !== undefined || pagination?.pageSize !== undefined) {
    const pParts: string[] = [];
    if (pagination?.page !== undefined) pParts.push(`page: ${pagination.page}`);
    if (pagination?.pageSize !== undefined) pParts.push(`pageSize: ${pagination.pageSize}`);
    args.push(`pagination: {${pParts.join(', ')}}`);
  }

  const argsStr = args.length ? `(${args.join(', ')})` : '';
  const query = `{ reviews${argsStr} { nodes { ${REVIEW_FIELDS} } } }`;

  try {
    const response = await graphqlClient.post<GqlResponse<{ reviews: { nodes: Review[] } }>>(
      query,
      undefined,
      { signal }
    );

    if (response.data?.errors?.length) {
      return { reviews: [], error: response.data.errors.map((e) => e.message).join('; ') };
    }
    return { reviews: response.data.data?.reviews?.nodes ?? [], error: null };
  } catch (err) {
    return { reviews: [], error: err instanceof Error ? err.message : 'Ошибка запроса' };
  }
};

export const getReview = async (
  id: number,
  signal?: AbortSignal
): Promise<{ review: Review | null; error: string | null }> => {
  const query = `{ review(id: ${id}) { ${REVIEW_FIELDS} } }`;

  try {
    const response = await graphqlClient.post<GqlResponse<{ review: Review | null }>>(
      query,
      undefined,
      { signal }
    );

    if (response.data?.errors?.length) {
      return { review: null, error: response.data.errors.map((e) => e.message).join('; ') };
    }
    return { review: response.data.data?.review ?? null, error: null };
  } catch (err) {
    return { review: null, error: err instanceof Error ? err.message : 'Ошибка запроса' };
  }
};

export const getReviewStatuses = async (
  signal?: AbortSignal
): Promise<{ statuses: ReviewStatus[]; error: string | null }> => {
  const query = `{ reviewStatuses { nodes { id name } } }`;

  try {
    const response = await graphqlClient.post<
      GqlResponse<{ reviewStatuses: { nodes: ReviewStatus[] } }>
    >(query, undefined, { signal });

    if (response.data?.errors?.length) {
      return { statuses: [], error: response.data.errors.map((e) => e.message).join('; ') };
    }
    return { statuses: response.data.data?.reviewStatuses?.nodes ?? [], error: null };
  } catch (err) {
    return { statuses: [], error: err instanceof Error ? err.message : 'Ошибка запроса' };
  }
};

export const getReviewsBatch = async (
  statusIds: number[] = [1, 2, 3, 4, 5, 6, 7],
  signal?: AbortSignal
) => {
  const queryParts = statusIds.map((statusId) => {
    return `status${statusId}: reviews(filter: {reviewStatusId: {eq: ${statusId}}}) { 
      nodes { ${REVIEW_FIELDS} } 
    }`;
  });

  const query = `{ ${queryParts.join('\n')} }`;

  try {
    const response = await graphqlClient.post<{
      data: Record<string, { nodes: Review[] }>;
      errors?: Array<{ message: string }>;
    }>(query, undefined, { signal });

    if (response.data?.errors?.length) {
      console.error('GraphQL errors:', response.data.errors);
      return null;
    }

    const result: Record<string, Review[]> = {};
    statusIds.forEach((statusId) => {
      const key = `status${statusId}`;
      result[key] = response.data.data?.[key]?.nodes ?? [];
    });

    return result;
  } catch (err) {
    console.error('Ошибка batch-запроса:', err);
    return null;
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
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        signal,
      }
    );
    return response.data;
  } catch (error) {
    console.error('Ошибка установки статуса:', error);
    return null;
  }
};

export const updateReview = async (
  id: number,
  data: { problemId?: string; statusId?: number; text?: string; imageName?: string },
  signal?: AbortSignal
): Promise<{ review: Review | null; error: string | null }> => {
  const mutation = `
    mutation($id: Int!, $data: UpdateReviewInput!) {
      updateReview(id: $id, data: $data) { ${REVIEW_FIELDS} }
    }
  `;

  try {
    const response = await graphqlClient.post<GqlResponse<{ updateReview: Review }>>(
      mutation,
      { id, data },
      { signal }
    );

    if (response.data?.errors?.length) {
      return { review: null, error: response.data.errors.map((e) => e.message).join('; ') };
    }
    return { review: response.data.data?.updateReview ?? null, error: null };
  } catch (err) {
    return { review: null, error: err instanceof Error ? err.message : 'Ошибка мутации' };
  }
};

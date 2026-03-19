import axios from 'axios';
import { BASE_API_URL } from './config.ts';

// ============================================================================
// GraphQL Response Types
// ============================================================================

export interface PageInfo {
  hasPreviousPage: boolean;
  hasNextPage: boolean;
  startCursor: string | null;
  endCursor: string | null;
}

export interface PaginationInfo {
  totalCount: number;
  currentPage: number;
  totalPages: number;
}

export interface Role {
  id: number;
  name: string;
}

export interface UserRole {
  userId: number;
  roleId: number;
  role: Role | null;
}

export interface User {
  id: number;
  login: string;
  fio: string | null;
  isActive: boolean;
  registrationDate: string;
  updatedAt: string;
  roles: UserRole[] | null;
}

export interface UserConnection {
  nodes: User[];
  pageInfo: PageInfo;
  paginationInfo: PaginationInfo;
}

export interface DeleteResult {
  success: boolean;
  message: string;
  deletedId: number | null;
}

export interface GrantRoleResult {
  success: boolean;
  message: string;
  user: User | null;
}

// ============================================================================
// GraphQL Query/Mutation Inputs
// ============================================================================

export interface PaginationInput {
  limit: number;
  offset: number;
}

export interface UserFilterInput {
  id?: number;
  login?: string;
  isActive?: boolean;
}

export interface CreateUserInput {
  login: string;
  password: string;
  fio?: string;
  isActive: boolean;
}

export interface UpdateUserInput {
  fio?: string;
  isActive?: boolean;
}

export interface ChangeUserPasswordInput {
  userId: number;
  newPassword: string;
}

export interface GrantRoleInput {
  userId: number;
  roleIds: number[];
}

// ============================================================================
// GraphQL Response Wrappers
// ============================================================================

export interface GqlResponseU<T> {
  data: T;
  errors?: Array<{
    message: string;
    locations?: Array<{ line: number; column: number }>;
    path?: string[];
  }>;
}

export interface UsersGqlResponse {
  users: UserConnection;
}

export interface UserGqlResponse {
  user: User | null;
}

export interface DeleteUserGqlResponse {
  deleteUser: DeleteResult;
}

export interface GrantRoleGqlResponse {
  grantRole: GrantRoleResult;
}

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

export interface AggregatedEndpointStats {
  totalVisits: number;
  totalUnique: number;
  totalVisitorCount: number;
  avgVisits: number;
  avgUnique: number;
  avgVisitorCount: number;
  entriesCount: number;
}

export interface BatchAggregatedGqlResponse {
  data: {
    site: AggregatedEndpointStats;
    auds: AggregatedEndpointStats;
    ways: AggregatedEndpointStats;
    plans: AggregatedEndpointStats;
  } | null;
  errors?: Array<{
    message: string;
    locations?: Array<{ line: number; column: number }>;
    path?: string[];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    extensions?: any;
  }>;
}

export type DateFilterType = 'byDate' | 'byMonth' | 'byYear';

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

export const get_all_stats_aggregated = async (
  filterType: DateFilterType,
  startDate: string,
  endDate: string,
  token: string,
  signal?: AbortSignal
) => {
  const filterString = `${filterType}: {start: "${startDate}", end: "${endDate}"}`;

  const query = `{
          site: endpointStatisticsAvg(endpoint: "site", ${filterString}) {
            totalVisits
            totalUnique
            totalVisitorCount
            avgVisits
            avgUnique
            avgVisitorCount
            entriesCount
          }
          auds: endpointStatisticsAvg(endpoint: "auds", ${filterString}) {
            totalVisits
            totalUnique
            totalVisitorCount
            avgVisits
            avgUnique
            avgVisitorCount
            entriesCount
          }
          ways: endpointStatisticsAvg(endpoint: "ways", ${filterString}) {
            totalVisits
            totalUnique
            totalVisitorCount
            avgVisits
            avgUnique
            avgVisitorCount
            entriesCount
          }
          plans: endpointStatisticsAvg(endpoint: "plans", ${filterString}) {
            totalVisits
            totalUnique
            totalVisitorCount
            avgVisits
            avgUnique
            avgVisitorCount
            entriesCount
          }
      }`;

  const response = await axios.post<BatchAggregatedGqlResponse>(
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

// ============================================================================
// API Functions User/Role
// ============================================================================

const graphqlClient = axios.create({
  baseURL: BASE_API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const getUsers = async (
  token: string,
  pagination: PaginationInput,
  filter?: UserFilterInput,
  signal?: AbortSignal
): Promise<UserConnection> => {
  const query = `
    query GetUsers($pagination: PaginationInput, $filter: UserFilterInput) {
      users(pagination: $pagination, filter: $filter) {
        nodes {
          id
          login
          fio
          isActive
          registrationDate
          updatedAt
          roles {
            userId
            roleId
            role {
              id
              name
            }
          }
        }
        pageInfo {
          hasPreviousPage
          hasNextPage
          startCursor
          endCursor
        }
        paginationInfo {
          totalCount
          currentPage
          totalPages
        }
      }
    }
  `;

  const response = await graphqlClient.post<GqlResponseU<UsersGqlResponse>>(
    '/graphql',
    { query, variables: { pagination, filter } },
    {
      headers: { Authorization: `Bearer ${token}` },
      signal,
    }
  );

  if (response.data.errors && response.data.errors.length > 0) {
    throw new Error(response.data.errors[0].message);
  }

  return response.data.data.users;
};

export const getUser = async (
  token: string,
  userId: number,
  signal?: AbortSignal
): Promise<User | null> => {
  const query = `
    query GetUser($userId: Int!) {
      user(userId: $userId) {
        id
        login
        fio
        isActive
        registrationDate
        updatedAt
        roles {
          userId
          roleId
          role {
            id
            name
          }
        }
      }
    }
  `;

  const response = await graphqlClient.post<GqlResponseU<UserGqlResponse>>(
    '/graphql',
    { query, variables: { userId } },
    {
      headers: { Authorization: `Bearer ${token}` },
      signal,
    }
  );

  if (response.data.errors && response.data.errors.length > 0) {
    throw new Error(response.data.errors[0].message);
  }

  return response.data.data.user;
};

export const createUser = async (
  token: string,
  data: CreateUserInput,
  signal?: AbortSignal
): Promise<User> => {
  const query = `
    mutation CreateUser($data: CreateUserInput!) {
      createUser(data: $data) {
        id
        login
        fio
        isActive
        registrationDate
        updatedAt
      }
    }
  `;

  const response = await graphqlClient.post<GqlResponseU<{ createUser: User }>>(
    '/graphql',
    { query, variables: { data } },
    {
      headers: { Authorization: `Bearer ${token}` },
      signal,
    }
  );

  if (response.data.errors && response.data.errors.length > 0) {
    throw new Error(response.data.errors[0].message);
  }

  return response.data.data.createUser;
};

export const updateUser = async (
  token: string,
  userId: number,
  data: UpdateUserInput,
  signal?: AbortSignal
): Promise<User> => {
  const query = `
    mutation UpdateUser($userId: Int!, $data: UpdateUserInput!) {
      updateUser(userId: $userId, data: $data) {
        id
        login
        fio
        isActive
        registrationDate
        updatedAt
        roles {
          userId
          roleId
          role {
            id
            name
          }
        }
      }
    }
  `;

  const response = await graphqlClient.post<GqlResponseU<{ updateUser: User }>>(
    '/graphql',
    { query, variables: { userId, data } },
    {
      headers: { Authorization: `Bearer ${token}` },
      signal,
    }
  );

  if (response.data.errors && response.data.errors.length > 0) {
    throw new Error(response.data.errors[0].message);
  }

  return response.data.data.updateUser;
};

export const deleteUser = async (
  token: string,
  userId: number,
  signal?: AbortSignal
): Promise<DeleteResult> => {
  const query = `
    mutation DeleteUser($userId: Int!) {
      deleteUser(userId: $userId) {
        success
        message
        deletedId
      }
    }
  `;

  const response = await graphqlClient.post<GqlResponseU<DeleteUserGqlResponse>>(
    '/graphql',
    { query, variables: { userId } },
    {
      headers: { Authorization: `Bearer ${token}` },
      signal,
    }
  );

  if (response.data.errors && response.data.errors.length > 0) {
    throw new Error(response.data.errors[0].message);
  }

  return response.data.data.deleteUser;
};

export const changeUserPassword = async (
  token: string,
  userId: number,
  newPassword: string,
  signal?: AbortSignal
): Promise<{ success: boolean; message: string }> => {
  const query = `
    mutation ChangeUserPassword($data: ChangeUserPasswordInput!) {
      changeUserPassword(data: $data) {
        success
        message
      }
    }
  `;

  const response = await graphqlClient.post<
    GqlResponseU<{ changeUserPassword: { success: boolean; message: string } }>
  >(
    '/graphql',
    { query, variables: { data: { userId, newPassword } } },
    {
      headers: { Authorization: `Bearer ${token}` },
      signal,
    }
  );

  if (response.data.errors && response.data.errors.length > 0) {
    throw new Error(response.data.errors[0].message);
  }

  return response.data.data.changeUserPassword;
};

export const grantRole = async (
  token: string,
  userId: number,
  roleIds: number[],
  signal?: AbortSignal
): Promise<GrantRoleResult> => {
  const query = `
    mutation GrantRole($data: GrantRoleInput!) {
      grantRole(data: $data) {
        success
        message
        user {
          id
          login
          roles {
            roleId
            role {
              id
              name
            }
          }
        }
      }
    }
  `;

  const response = await graphqlClient.post<GqlResponseU<GrantRoleGqlResponse>>(
    '/graphql',
    { query, variables: { data: { userId, roleIds } } },
    {
      headers: { Authorization: `Bearer ${token}` },
      signal,
    }
  );

  if (response.data.errors && response.data.errors.length > 0) {
    throw new Error(response.data.errors[0].message);
  }

  return response.data.data.grantRole;
};

export const getRoles = async (token: string, signal?: AbortSignal): Promise<Role[]> => {
  const query = `
    query GetRoles {
      roles(pagination: { limit: 100 }) {
        nodes {
          id
          name
        }
      }
    }
  `;

  const response = await graphqlClient.post<GqlResponseU<{ roles: { nodes: Role[] } }>>(
    '/graphql',
    { query },
    {
      headers: { Authorization: `Bearer ${token}` },
      signal,
    }
  );

  if (response.data.errors && response.data.errors.length > 0) {
    throw new Error(response.data.errors[0].message);
  }

  return response.data.data.roles.nodes;
};

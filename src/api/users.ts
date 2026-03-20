import { graphqlClient, restClient } from './client.ts';
import { BASE_API_URL } from '../config.ts';
import type {
  GqlResponse,
  User,
  UserConnection,
  UserFilterInput,
  PaginationInput,
  CreateUserInput,
  UpdateUserInput,
  GrantRoleResult,
  DeleteResult,
} from './types.ts';

export const getUsers = async (
  token: string,
  pagination: PaginationInput,
  filter?: UserFilterInput,
  signal?: AbortSignal
): Promise<UserConnection> => {
  const query = `query GetUsers($pagination: PaginationInput, $filter: UserFilterInput) { 
    users(pagination: $pagination, filter: $filter) { 
      nodes { id login fio isActive registrationDate updatedAt roles { userId roleId role { id name } } } 
      pageInfo { hasPreviousPage hasNextPage startCursor endCursor } 
      paginationInfo { totalCount currentPage totalPages } 
    } 
  }`;

  const response = await graphqlClient.post<GqlResponse<{ users: UserConnection }>>(
    '/graphql',
    { query, variables: { pagination, filter } },
    {
      headers: { Authorization: `Bearer ${token}` },
      signal,
    }
  );

  if (response.data.errors?.length) {
    throw new Error(response.data.errors[0].message);
  }

  return response.data.data.users;
};

export const getUser = async (
  token: string,
  userId: number,
  signal?: AbortSignal
): Promise<User | null> => {
  const query = `query GetUser($userId: Int!) { 
    user(userId: $userId) { 
      id login fio isActive registrationDate updatedAt 
      roles { userId roleId role { id name } } 
    } 
  }`;

  const response = await graphqlClient.post<GqlResponse<{ user: User | null }>>(
    '/graphql',
    { query, variables: { userId } },
    {
      headers: { Authorization: `Bearer ${token}` },
      signal,
    }
  );

  if (response.data.errors?.length) {
    throw new Error(response.data.errors[0].message);
  }

  return response.data.data.user;
};

export const createUser = async (
  token: string,
  data: CreateUserInput,
  signal?: AbortSignal
): Promise<User> => {
  const query = `mutation CreateUser($data: CreateUserInput!) { 
    createUser(data: $data) { 
      id login fio isActive registrationDate updatedAt 
    } 
  }`;

  const response = await graphqlClient.post<GqlResponse<{ createUser: User }>>(
    '/graphql',
    { query, variables: { data } },
    {
      headers: { Authorization: `Bearer ${token}` },
      signal,
    }
  );

  if (response.data.errors?.length) {
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
  const query = `mutation UpdateUser($userId: Int!, $data: UpdateUserInput!) { 
    updateUser(userId: $userId, data: $data) { 
      id login fio isActive registrationDate updatedAt 
      roles { userId roleId role { id name } } 
    } 
  }`;

  const response = await graphqlClient.post<GqlResponse<{ updateUser: User }>>(
    '/graphql',
    { query, variables: { userId, data } },
    {
      headers: { Authorization: `Bearer ${token}` },
      signal,
    }
  );

  if (response.data.errors?.length) {
    throw new Error(response.data.errors[0].message);
  }

  return response.data.data.updateUser;
};

export const deleteUser = async (
  token: string,
  userId: number,
  signal?: AbortSignal
): Promise<DeleteResult> => {
  const query = `mutation DeleteUser($userId: Int!) { 
    deleteUser(userId: $userId) { 
      success message deletedId 
    } 
  }`;

  const response = await graphqlClient.post<GqlResponse<{ deleteUser: DeleteResult }>>(
    '/graphql',
    { query, variables: { userId } },
    {
      headers: { Authorization: `Bearer ${token}` },
      signal,
    }
  );

  if (response.data.errors?.length) {
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
  const query = `mutation ChangeUserPassword($data: ChangeUserPasswordInput!) { 
    changeUserPassword(data: $data) { 
      success message 
    } 
  }`;

  const response = await graphqlClient.post<
    GqlResponse<{ changeUserPassword: { success: boolean; message: string } }>
  >(
    '/graphql',
    { query, variables: { data: { userId, newPassword } } },
    {
      headers: { Authorization: `Bearer ${token}` },
      signal,
    }
  );

  if (response.data.errors?.length) {
    throw new Error(response.data.errors[0].message);
  }

  return response.data.data.changeUserPassword;
};

export const changeUserPasswordRest = async (
  token: string,
  oldPassword: string,
  newPassword: string,
  signal?: AbortSignal
): Promise<{ success: boolean; message: string }> => {
  const params = new URLSearchParams();
  params.append('old_password', oldPassword);
  params.append('new_password', newPassword);

  const response = await restClient.post(`${BASE_API_URL}/auth/change-pass`, params, {
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      Authorization: `Bearer ${token}`,
    },
    signal,
  });

  return response.data;
};

export const grantRole = async (
  token: string,
  userId: number,
  roleIds: number[],
  signal?: AbortSignal
): Promise<GrantRoleResult> => {
  const query = `mutation GrantRole($data: GrantRoleInput!) { 
    grantRole(data: $data) { 
      success message user { id login roles { roleId role { id name } } } 
    } 
  }`;

  const response = await graphqlClient.post<GqlResponse<{ grantRole: GrantRoleResult }>>(
    '/graphql',
    { query, variables: { data: { userId, roleIds } } },
    {
      headers: { Authorization: `Bearer ${token}` },
      signal,
    }
  );

  if (response.data.errors?.length) {
    throw new Error(response.data.errors[0].message);
  }

  return response.data.data.grantRole;
};

export const revokeRole = async (
  token: string,
  userId: number,
  roleId: number,
  signal?: AbortSignal
): Promise<GrantRoleResult> => {
  const query = `mutation RevokeRole($userId: Int!, $roleId: Int!) { 
    revokeRole(userId: $userId, roleId: $roleId) { 
      success message user { id login roles { roleId role { id name } } } 
    } 
  }`;

  const response = await graphqlClient.post<GqlResponse<{ revokeRole: GrantRoleResult }>>(
    '/graphql',
    { query, variables: { userId, roleId } },
    {
      headers: { Authorization: `Bearer ${token}` },
      signal,
    }
  );

  if (response.data.errors?.length) {
    throw new Error(response.data.errors[0].message);
  }

  return response.data.data.revokeRole;
};

import { graphqlClient, restClient } from './client.ts';
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
    query,
    { pagination, filter },
    { signal }
  );

  if (response.data.errors?.length) {
    throw new Error(response.data.errors[0].message);
  }

  return response.data.data.users;
};

export const getUser = async (userId: number, signal?: AbortSignal): Promise<User | null> => {
  const query = `query GetUser($userId: Int!) { 
    user(userId: $userId) { 
      id login fio isActive registrationDate updatedAt 
      roles { userId roleId role { id name } } 
    } 
  }`;

  const response = await graphqlClient.post<GqlResponse<{ user: User | null }>>(
    query,
    { userId },
    { signal }
  );

  if (response.data.errors?.length) {
    throw new Error(response.data.errors[0].message);
  }

  return response.data.data.user;
};

export const createUser = async (data: CreateUserInput, signal?: AbortSignal): Promise<User> => {
  const query = `mutation CreateUser($data: CreateUserInput!) { 
    createUser(data: $data) { 
      id login fio isActive registrationDate updatedAt 
    } 
  }`;

  const response = await graphqlClient.post<GqlResponse<{ createUser: User }>>(
    query,
    { data },
    { signal }
  );

  if (response.data.errors?.length) {
    throw new Error(response.data.errors[0].message);
  }

  return response.data.data.createUser;
};

export const updateUser = async (
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
    query,
    { userId, data },
    { signal }
  );

  if (response.data.errors?.length) {
    throw new Error(response.data.errors[0].message);
  }

  return response.data.data.updateUser;
};

export const deleteUser = async (userId: number, signal?: AbortSignal): Promise<DeleteResult> => {
  const query = `mutation DeleteUser($userId: Int!) { 
    deleteUser(userId: $userId) { 
      success message deletedId 
    } 
  }`;

  const response = await graphqlClient.post<GqlResponse<{ deleteUser: DeleteResult }>>(
    query,
    { userId },
    { signal }
  );

  if (response.data.errors?.length) {
    throw new Error(response.data.errors[0].message);
  }

  return response.data.data.deleteUser;
};

export const changeUserPassword = async (
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
  >(query, { data: { userId, newPassword } }, { signal });

  if (response.data.errors?.length) {
    throw new Error(response.data.errors[0].message);
  }

  return response.data.data.changeUserPassword;
};

export const changeUserPasswordRest = async (
  oldPassword: string,
  newPassword: string,
  signal?: AbortSignal
): Promise<{ success: boolean; message: string }> => {
  const params = new URLSearchParams();
  params.append('old_password', oldPassword);
  params.append('new_password', newPassword);

  const response = await restClient.post<{ success: boolean; message: string }>(
    `/auth/change-pass`,
    params,
    {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      signal,
    }
  );

  return response.data;
};

export const grantRole = async (
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
    query,
    { data: { userId, roleIds } },
    { signal }
  );

  if (response.data.errors?.length) {
    throw new Error(response.data.errors[0].message);
  }

  return response.data.data.grantRole;
};

export const revokeRole = async (
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
    query,
    { userId, roleId },
    { signal }
  );

  if (response.data.errors?.length) {
    throw new Error(response.data.errors[0].message);
  }

  return response.data.data.revokeRole;
};

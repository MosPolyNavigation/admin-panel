import { graphqlClient, restClient } from './client.ts';
import type {
  GqlResponse,
  User,
  UserConnection,
  UserFilterInput,
  PaginationInput,
  CreateUserInput,
  UpdateUserInput,
} from './types.ts';

const USER_FIELDS = 'id login fio isActive registrationDate updatedAt';
const USER_ROLE_FIELDS = 'userId roleId role { id name }';

export const getUsers = async (
  pagination: PaginationInput,
  filter?: UserFilterInput,
  signal?: AbortSignal
): Promise<{ users: UserConnection; error: string | null }> => {
  const query = `query GetUsers($pagination: PaginationInput, $filter: UserFilterInput) { 
    users(pagination: $pagination, filter: $filter) { 
      nodes { ${USER_FIELDS} userRoles { ${USER_ROLE_FIELDS} } } 
      pageInfo { hasPreviousPage hasNextPage startCursor endCursor } 
      paginationInfo { totalCount currentPage totalPages } 
    } 
  }`;

  try {
    const response = await graphqlClient.post<GqlResponse<{ users: UserConnection }>>(
      query,
      { pagination, filter },
      { signal }
    );

    if (response.data.errors?.length) {
      return {
        users: {} as UserConnection,
        error: response.data.errors.map((e) => e.message).join('; '),
      };
    }
    return { users: response.data.data.users, error: null };
  } catch (err) {
    return {
      users: {} as UserConnection,
      error: err instanceof Error ? err.message : 'Ошибка запроса',
    };
  }
};

export const getUser = async (
  id: number,
  signal?: AbortSignal
): Promise<{ user: User | null; error: string | null }> => {
  const query = `query GetUser($id: Int!) { 
    user(id: $id) { 
      ${USER_FIELDS}
      roles { ${USER_ROLE_FIELDS} } 
    } 
  }`;

  try {
    const response = await graphqlClient.post<GqlResponse<{ user: User | null }>>(
      query,
      { id },
      { signal }
    );

    if (response.data.errors?.length) {
      return { user: null, error: response.data.errors.map((e) => e.message).join('; ') };
    }
    return { user: response.data.data.user, error: null };
  } catch (err) {
    return { user: null, error: err instanceof Error ? err.message : 'Ошибка запроса' };
  }
};

export const createUser = async (
  data: CreateUserInput,
  signal?: AbortSignal
): Promise<{ user: User | null; error: string | null }> => {
  const query = `mutation CreateUser($data: CreateUserInput!) { 
    createUser(data: $data) { ${USER_FIELDS} } 
  }`;

  try {
    const response = await graphqlClient.post<GqlResponse<{ createUser: User }>>(
      query,
      { data },
      { signal }
    );

    if (response.data.errors?.length) {
      return { user: null, error: response.data.errors.map((e) => e.message).join('; ') };
    }
    return { user: response.data.data.createUser, error: null };
  } catch (err) {
    return { user: null, error: err instanceof Error ? err.message : 'Ошибка мутации' };
  }
};

export const updateUser = async (
  id: number,
  data: UpdateUserInput,
  signal?: AbortSignal
): Promise<{ user: User | null; error: string | null }> => {
  const query = `mutation UpdateUser($id: Int!, $data: UpdateUserInput!) { 
    updateUser(id: $id, data: $data) { 
      ${USER_FIELDS}
      roles { ${USER_ROLE_FIELDS} } 
    } 
  }`;

  try {
    const response = await graphqlClient.post<GqlResponse<{ updateUser: User }>>(
      query,
      { id, data },
      { signal }
    );

    if (response.data.errors?.length) {
      return { user: null, error: response.data.errors.map((e) => e.message).join('; ') };
    }
    return { user: response.data.data.updateUser, error: null };
  } catch (err) {
    return { user: null, error: err instanceof Error ? err.message : 'Ошибка мутации' };
  }
};

export const deleteUser = async (
  id: number,
  signal?: AbortSignal
): Promise<{ ok: boolean; error: string | null }> => {
  const query = `mutation DeleteUser($id: Int!) { deleteUser(id: $id) }`;

  try {
    const response = await graphqlClient.post<GqlResponse<{ deleteUser: boolean }>>(
      query,
      { id },
      { signal }
    );

    if (response.data.errors?.length) {
      return { ok: false, error: response.data.errors.map((e) => e.message).join('; ') };
    }
    return { ok: Boolean(response.data.data?.deleteUser), error: null };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : 'Ошибка удаления' };
  }
};

export const changeUserPassword = async (
  userId: number,
  newPassword: string,
  signal?: AbortSignal
): Promise<{ ok: boolean; error: string | null }> => {
  const query = `mutation ChangeUserPassword($data: ChangeUserPasswordInput!) { 
    changeUserPassword(data: $data) 
  }`;

  try {
    const response = await graphqlClient.post<GqlResponse<{ changeUserPassword: boolean }>>(
      query,
      { data: { userId, newPassword } },
      { signal }
    );

    if (response.data.errors?.length) {
      return { ok: false, error: response.data.errors.map((e) => e.message).join('; ') };
    }
    return { ok: Boolean(response.data.data?.changeUserPassword), error: null };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : 'Ошибка смены пароля' };
  }
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
): Promise<{ ok: boolean; error: string | null }> => {
  const query = `mutation GrantRole($data: GrantRoleInput!) { 
    grantRole(data: $data) 
  }`;

  try {
    const response = await graphqlClient.post<GqlResponse<{ grantRole: boolean }>>(
      query,
      { data: { userId, roleIds } },
      { signal }
    );

    if (response.data.errors?.length) {
      return { ok: false, error: response.data.errors.map((e) => e.message).join('; ') };
    }
    return { ok: Boolean(response.data.data?.grantRole), error: null };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : 'Ошибка назначения роли' };
  }
};

export const revokeRole = async (
  userId: number,
  roleId: number,
  signal?: AbortSignal
): Promise<{ ok: boolean; error: string | null }> => {
  const query = `mutation RevokeRole($userId: Int!, $roleId: Int!) { 
    revokeRole(userId: $userId, roleId: $roleId) 
  }`;

  try {
    const response = await graphqlClient.post<GqlResponse<{ revokeRole: boolean }>>(
      query,
      { userId, roleId },
      { signal }
    );

    if (response.data.errors?.length) {
      return { ok: false, error: response.data.errors.map((e) => e.message).join('; ') };
    }
    return { ok: Boolean(response.data.data?.revokeRole), error: null };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : 'Ошибка отзыва роли' };
  }
};

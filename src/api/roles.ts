import { graphqlClient } from './client.ts';
import type {
  GqlResponse,
  Role,
  RoleConnection,
  RoleFilterInput,
  PaginationInput,
  CreateRoleInput,
  UpdateRoleInput,
  Right,
  Goal,
  UserRoleConnection,
} from './types.ts';

const ROLE_FIELDS = 'id name';
const ROLE_RIGHT_GOAL_FIELDS = 'roleId rightId goalId canGrant right { id name } goal { id name }';
const USER_ROLE_FIELDS = 'userId roleId user { id login fio isActive registrationDate }';

// ============================================================================
// РОЛИ: Получение списка с фильтрацией и пагинацией
// ============================================================================

export const getRoles = async (
  pagination: PaginationInput,
  filter?: RoleFilterInput,
  signal?: AbortSignal
): Promise<{ roles: RoleConnection; error: string | null }> => {
  const query = `query GetRoles($pagination: PaginationInput, $filter: RoleFilterInput) { 
    roles(pagination: $pagination, filter: $filter) { 
      nodes { ${ROLE_FIELDS} roleRightGoals { ${ROLE_RIGHT_GOAL_FIELDS} } userRoles { ${USER_ROLE_FIELDS} } } 
      pageInfo { hasPreviousPage hasNextPage startCursor endCursor } 
      paginationInfo { totalCount currentPage totalPages } 
    } 
  }`;

  try {
    const response = await graphqlClient.post<GqlResponse<{ roles: RoleConnection }>>(
      query,
      { pagination, filter },
      { signal }
    );

    if (response.data.errors?.length) {
      return {
        roles: {} as RoleConnection,
        error: response.data.errors.map((e) => e.message).join('; '),
      };
    }
    return { roles: response.data.data.roles, error: null };
  } catch (err) {
    return {
      roles: {} as RoleConnection,
      error: err instanceof Error ? err.message : 'Ошибка запроса',
    };
  }
};

// ============================================================================
// РОЛЬ: Получение одной роли по ID
// ============================================================================

// 🔧 Исправлено: аргумент `id`, а не `roleId`
export const getRole = async (
  id: number,
  signal?: AbortSignal
): Promise<{ role: Role | null; error: string | null }> => {
  const query = `query GetRole($id: Int!) { 
    role(id: $id) { 
      ${ROLE_FIELDS}
      roleRightGoals { ${ROLE_RIGHT_GOAL_FIELDS} } 
      userRoles { ${USER_ROLE_FIELDS} } 
    } 
  }`;

  try {
    const response = await graphqlClient.post<GqlResponse<{ role: Role | null }>>(
      query,
      { id },
      { signal }
    );

    if (response.data.errors?.length) {
      return { role: null, error: response.data.errors.map((e) => e.message).join('; ') };
    }
    return { role: response.data.data.role, error: null };
  } catch (err) {
    return { role: null, error: err instanceof Error ? err.message : 'Ошибка запроса' };
  }
};

// ============================================================================
// РОЛИ: Создание / Обновление / Удаление
// ============================================================================

export const createRole = async (
  data: CreateRoleInput,
  signal?: AbortSignal
): Promise<{ role: Role | null; error: string | null }> => {
  const query = `mutation CreateRole($data: CreateRoleInput!) { 
    createRole(data: $data) { 
      ${ROLE_FIELDS} roleRightGoals { ${ROLE_RIGHT_GOAL_FIELDS} } 
    } 
  }`;

  try {
    const response = await graphqlClient.post<GqlResponse<{ createRole: Role }>>(
      query,
      { data },
      { signal }
    );

    if (response.data.errors?.length) {
      return { role: null, error: response.data.errors.map((e) => e.message).join('; ') };
    }
    return { role: response.data.data.createRole, error: null };
  } catch (err) {
    return { role: null, error: err instanceof Error ? err.message : 'Ошибка мутации' };
  }
};

export const updateRole = async (
  id: number,
  data: UpdateRoleInput,
  signal?: AbortSignal
): Promise<{ role: Role | null; error: string | null }> => {
  const query = `mutation UpdateRole($id: Int!, $data: UpdateRoleInput!) { 
    updateRole(id: $id, data: $data) { 
      ${ROLE_FIELDS} roleRightGoals { ${ROLE_RIGHT_GOAL_FIELDS} } 
    } 
  }`;

  try {
    const response = await graphqlClient.post<GqlResponse<{ updateRole: Role }>>(
      query,
      { id, data },
      { signal }
    );

    if (response.data.errors?.length) {
      return { role: null, error: response.data.errors.map((e) => e.message).join('; ') };
    }
    return { role: response.data.data.updateRole, error: null };
  } catch (err) {
    return { role: null, error: err instanceof Error ? err.message : 'Ошибка мутации' };
  }
};

// 🔧 Исправлено: возвращает Boolean, а не DeleteResult
export const deleteRole = async (
  id: number,
  signal?: AbortSignal
): Promise<{ ok: boolean; error: string | null }> => {
  const query = `mutation DeleteRole($id: Int!) { deleteRole(id: $id) }`;

  try {
    const response = await graphqlClient.post<GqlResponse<{ deleteRole: boolean }>>(
      query,
      { id },
      { signal }
    );

    if (response.data.errors?.length) {
      return { ok: false, error: response.data.errors.map((e) => e.message).join('; ') };
    }
    return { ok: Boolean(response.data.data?.deleteRole), error: null };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : 'Ошибка удаления' };
  }
};

// ============================================================================
// ПРАВА И ЦЕЛИ: Справочники
// ============================================================================

// 🔧 Исправлено: пагинация { page, pageSize } вместо { limit }
export const getRights = async (
  signal?: AbortSignal
): Promise<{ rights: Right[]; error: string | null }> => {
  const query = `query GetRights { 
    rights(pagination: { page: 1, pageSize: 100 }) { 
      nodes { id name } 
    } 
  }`;

  try {
    const response = await graphqlClient.post<GqlResponse<{ rights: { nodes: Right[] } }>>(
      query,
      undefined,
      { signal }
    );

    if (response.data.errors?.length) {
      return { rights: [], error: response.data.errors.map((e) => e.message).join('; ') };
    }
    return { rights: response.data.data.rights.nodes, error: null };
  } catch (err) {
    return { rights: [], error: err instanceof Error ? err.message : 'Ошибка запроса' };
  }
};

export const getGoals = async (
  signal?: AbortSignal
): Promise<{ goals: Goal[]; error: string | null }> => {
  const query = `query GetGoals { 
    goals(pagination: { page: 1, pageSize: 100 }) { 
      nodes { id name } 
    } 
  }`;

  try {
    const response = await graphqlClient.post<GqlResponse<{ goals: { nodes: Goal[] } }>>(
      query,
      undefined,
      { signal }
    );

    if (response.data.errors?.length) {
      return { goals: [], error: response.data.errors.map((e) => e.message).join('; ') };
    }
    return { goals: response.data.data.goals.nodes, error: null };
  } catch (err) {
    return { goals: [], error: err instanceof Error ? err.message : 'Ошибка запроса' };
  }
};

// ============================================================================
// ПОЛЬЗОВАТЕЛИ РОЛИ: Получение списка пользователей с ролью
// ============================================================================

// 🔧 Исправлено: фильтр { roleId: { eq: ... } }
export const getUsersByRole = async (
  roleId: number,
  pagination: PaginationInput,
  signal?: AbortSignal
): Promise<{ userRoles: UserRoleConnection; error: string | null }> => {
  const query = `query GetUserRoles($filter: UserRoleFilterInput, $pagination: PaginationInput) { 
    userRoles(filter: $filter, pagination: $pagination) { 
      nodes { ${USER_ROLE_FIELDS} } 
      pageInfo { hasPreviousPage hasNextPage startCursor endCursor } 
      paginationInfo { totalCount currentPage totalPages } 
    } 
  }`;

  try {
    const response = await graphqlClient.post<GqlResponse<{ userRoles: UserRoleConnection }>>(
      query,
      { filter: { roleId: { eq: roleId } }, pagination },
      { signal }
    );

    if (response.data.errors?.length) {
      return {
        userRoles: {} as UserRoleConnection,
        error: response.data.errors.map((e) => e.message).join('; '),
      };
    }
    return { userRoles: response.data.data.userRoles, error: null };
  } catch (err) {
    return {
      userRoles: {} as UserRoleConnection,
      error: err instanceof Error ? err.message : 'Ошибка запроса',
    };
  }
};

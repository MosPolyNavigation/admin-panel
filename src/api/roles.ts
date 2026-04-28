import { graphqlClient } from './client.ts';
import type {
  GqlResponse,
  Role,
  RoleConnection,
  RoleFilterInput,
  PaginationInput,
  CreateRoleInput,
  UpdateRoleInput,
  DeleteResult,
  Right,
  Goal,
  UserRoleConnection,
} from './types.ts';

export const getRoles = async (
  pagination: PaginationInput,
  filter?: RoleFilterInput,
  signal?: AbortSignal
): Promise<RoleConnection> => {
  const query = `query GetRoles($pagination: PaginationInput, $filter: RoleFilterInput) { 
    roles(pagination: $pagination, filter: $filter) { 
      nodes { id name roleRightGoals { roleId rightId goalId } userRoles { userId roleId } } 
      pageInfo { hasPreviousPage hasNextPage startCursor endCursor } 
      paginationInfo { totalCount currentPage totalPages } 
    } 
  }`;

  const response = await graphqlClient.post<GqlResponse<{ roles: RoleConnection }>>(
    query,
    { pagination, filter },
    { signal }
  );

  if (response.data.errors?.length) {
    throw new Error(response.data.errors[0].message);
  }

  return response.data.data.roles;
};

export const getRole = async (roleId: number, signal?: AbortSignal): Promise<Role | null> => {
  const query = `query GetRole($roleId: Int!) { 
    role(roleId: $roleId) { 
      id name 
      roleRightGoals { roleId rightId goalId right { id name } goal { id name } } 
      userRoles { userId roleId user { id login } } 
    } 
  }`;

  const response = await graphqlClient.post<GqlResponse<{ role: Role | null }>>(
    query,
    { roleId },
    { signal }
  );

  if (response.data.errors?.length) {
    throw new Error(response.data.errors[0].message);
  }

  return response.data.data.role;
};

export const createRole = async (data: CreateRoleInput, signal?: AbortSignal): Promise<Role> => {
  const query = `mutation CreateRole($data: CreateRoleInput!) { 
    createRole(data: $data) { 
      id name roleRightGoals { roleId rightId goalId } 
    } 
  }`;

  const response = await graphqlClient.post<GqlResponse<{ createRole: Role }>>(
    query,
    { data },
    { signal }
  );

  if (response.data.errors?.length) {
    throw new Error(response.data.errors[0].message);
  }

  return response.data.data.createRole;
};

export const updateRole = async (
  roleId: number,
  data: UpdateRoleInput,
  signal?: AbortSignal
): Promise<Role> => {
  const query = `mutation UpdateRole($roleId: Int!, $data: UpdateRoleInput!) { 
    updateRole(roleId: $roleId, data: $data) { 
      id name roleRightGoals { roleId rightId goalId } 
    } 
  }`;

  const response = await graphqlClient.post<GqlResponse<{ updateRole: Role }>>(
    query,
    { roleId, data },
    { signal }
  );

  if (response.data.errors?.length) {
    throw new Error(response.data.errors[0].message);
  }

  return response.data.data.updateRole;
};

export const deleteRole = async (roleId: number, signal?: AbortSignal): Promise<DeleteResult> => {
  const query = `mutation DeleteRole($roleId: Int!) { 
    deleteRole(roleId: $roleId) { 
      success message deletedId 
    } 
  }`;

  const response = await graphqlClient.post<GqlResponse<{ deleteRole: DeleteResult }>>(
    query,
    { roleId },
    { signal }
  );

  if (response.data.errors?.length) {
    throw new Error(response.data.errors[0].message);
  }

  return response.data.data.deleteRole;
};

export const getRights = async (signal?: AbortSignal): Promise<Right[]> => {
  const query = `query GetRights { 
    rights(pagination: { limit: 100 }) { 
      nodes { id name } 
    } 
  }`;

  const response = await graphqlClient.post<GqlResponse<{ rights: { nodes: Right[] } }>>(
    query,
    undefined,
    { signal }
  );

  if (response.data.errors?.length) {
    throw new Error(response.data.errors[0].message);
  }

  return response.data.data.rights.nodes;
};

export const getGoals = async (signal?: AbortSignal): Promise<Goal[]> => {
  const query = `query GetGoals { 
    goals(pagination: { limit: 100 }) { 
      nodes { id name } 
    } 
  }`;

  const response = await graphqlClient.post<GqlResponse<{ goals: { nodes: Goal[] } }>>(
    query,
    undefined,
    { signal }
  );

  if (response.data.errors?.length) {
    throw new Error(response.data.errors[0].message);
  }

  return response.data.data.goals.nodes;
};

export const getUsersByRole = async (
  roleId: number,
  pagination: PaginationInput,
  signal?: AbortSignal
): Promise<UserRoleConnection> => {
  const query = `query GetUserRoles($filter: UserRoleFilterInput, $pagination: PaginationInput) { 
    userRoles(filter: $filter, pagination: $pagination) { 
      nodes { userId roleId user { id login fio isActive registrationDate } } 
      pageInfo { hasPreviousPage hasNextPage startCursor endCursor } 
      paginationInfo { totalCount currentPage totalPages } 
    } 
  }`;

  const response = await graphqlClient.post<GqlResponse<{ userRoles: UserRoleConnection }>>(
    query,
    { filter: { roleId }, pagination },
    { signal }
  );

  if (response.data.errors?.length) {
    throw new Error(response.data.errors[0].message);
  }

  return response.data.data.userRoles;
};

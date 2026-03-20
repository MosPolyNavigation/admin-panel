// ============================================================================
// ОБЩИЕ ТИПЫ
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

export interface PaginationInput {
  limit: number;
  offset: number;
}

export interface DeleteResult {
  success: boolean;
  message: string;
  deletedId: number | null;
}

export interface GqlResponse<T = unknown> {
  data: T;
  errors?: Array<{
    message: string;
    locations?: Array<{ line: number; column: number }>;
    path?: string[];
  }>;
}

// ============================================================================
// ПОЛЬЗОВАТЕЛИ И РОЛИ
// ============================================================================
export interface Role {
  id: number;
  name: string;
  roleRightGoals: RoleRightGoal[] | null;
  userRoles: UserRole[] | null;
}

export interface Right {
  id: number;
  name: string;
}

export interface Goal {
  id: number;
  name: string;
}

export interface RoleRightGoal {
  roleId: number;
  rightId: number;
  goalId: number;
  right: Right | null;
  goal: Goal | null;
}

export interface RoleRightGoalInput {
  rightId: number;
  goalId: number;
}

export interface UserRole {
  userId: number;
  roleId: number;
  role: Role | null;
  user: User | null;
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

export interface RoleFilterInput {
  id?: number;
  name?: string;
}

export interface CreateRoleInput {
  name: string;
  roleRightGoals?: RoleRightGoalInput[];
}

export interface UpdateRoleInput {
  name?: string;
  roleRightGoals?: RoleRightGoalInput[];
}

export interface UserConnection {
  nodes: User[];
  pageInfo: PageInfo;
  paginationInfo: PaginationInfo;
}

export interface UserRoleConnection {
  nodes: UserRole[];
  pageInfo: PageInfo;
  paginationInfo: PaginationInfo;
}

export interface RoleConnection {
  nodes: Role[];
  pageInfo: PageInfo;
  paginationInfo: PaginationInfo;
}

export interface GrantRoleResult {
  success: boolean;
  message: string;
  user: User | null;
}

// ============================================================================
// ОТЗЫВЫ
// ============================================================================
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

export interface SetReviewStatusResponse {
  message: string;
  review_id: number;
  status_id: number;
  status_name: string;
}

// ============================================================================
// СТАТИСТИКА
// ============================================================================
export type DateFilterType = 'byDate' | 'byMonth' | 'byYear';

export interface EndpointStatistics {
  allVisits: number;
  period: string;
  uniqueVisitors: number;
  visitorCount: number;
  [key: string]: string | number | Date | null | undefined;
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

// ============================================================================
// БАНЫ
// ============================================================================
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

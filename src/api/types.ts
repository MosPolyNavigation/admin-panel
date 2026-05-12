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
  page: number;
  pageSize: number;
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
// ФИЛЬТРЫ — ИСПРАВЛЕНО (вложенные объекты)
// ============================================================================
export interface IntFilterInput {
  eq?: number | null;
  ne?: number | null;
  gt?: number | null;
  gte?: number | null;
  lt?: number | null;
  lte?: number | null;
  isIn?: number[] | null;
  isNotIn?: number[] | null;
  isNull?: boolean | null;
  between?: [number, number] | null;
  notBetween?: [number, number] | null;
}

export interface StringFilterInput {
  eq?: string | null;
  ne?: string | null;
  ciEq?: string | null;
  contains?: string | null;
  startsWith?: string | null;
  endsWith?: string | null;
  like?: string | null;
  notLike?: string | null;
  isIn?: string[] | null;
  isNotIn?: string[] | null;
  isNull?: boolean | null;
}

export interface BooleanFilterInput {
  eq?: boolean | null;
  ne?: boolean | null;
  isNull?: boolean | null;
}

export interface RoleFilterInput {
  id?: IntFilterInput | null;
  name?: StringFilterInput | null;
  and?: RoleFilterInput[] | null;
  or?: RoleFilterInput[] | null;
  not?: RoleFilterInput | null;
}

export interface UserFilterInput {
  id?: IntFilterInput | null;
  login?: StringFilterInput | null;
  fio?: StringFilterInput | null;
  isActive?: BooleanFilterInput | null;
  and?: UserFilterInput[] | null;
  or?: UserFilterInput[] | null;
  not?: UserFilterInput | null;
}

export interface ReviewFilterInput {
  id?: IntFilterInput | null;
  clientId?: IntFilterInput | null;
  problemId?: StringFilterInput | null;
  reviewStatusId?: IntFilterInput | null;
  text?: StringFilterInput | null;
  and?: ReviewFilterInput[] | null;
  or?: ReviewFilterInput[] | null;
  not?: ReviewFilterInput | null;
}

// ============================================================================
// ПОЛЬЗОВАТЕЛИ И РОЛИ
// ============================================================================
export interface Role {
  id: number;
  name: string;
  roleRightGoals?: RoleRightGoal[] | null;
  userRoles?: UserRole[] | null;
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
  canGrant: boolean;
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

export interface RefreshToken {
  id: number;
  userId: number;
  jti: string;
  expDate: string;
  browser?: string;
  userIp?: string;
  revoked: boolean;
  createdAt: string;
}

export interface UserLog {
  id: number;
  userId: number;
  text: string;
  createdAt: string;
}

export interface User {
  id: number;
  login: string;
  fio: string | null;
  isActive: boolean;
  registrationDate: string;
  updatedAt: string;
  userRoles: UserRole[] | null;
  refreshTokens: RefreshToken[];
  userLogs: UserLog[];
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

// ============================================================================
// ОТЗЫВЫ
// ============================================================================
export interface Review {
  id: number;
  clientId: number;
  problemId: string;
  statusId: number;
  text: string;
  imageName: string | null;
  creationDate: string;
  client?: ClientId | null;
  problem?: Problem | null;
  status?: ReviewStatus | null;
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

export interface ClientId {
  id: number;
  ident: string;
  creationDate: string;
}

export interface Problem {
  id: string;
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

// ============================================================================
// НАВИГАЦИЯ (локации)
// ============================================================================
export interface NavLocation {
  id: number;
  idSys: string;
  name: string;
  short: string;
  ready: boolean;
  metro: string;
  address: string;
  comments: string | null;
  crossings: string | null;
}

export interface NavAuditory {
  id: number;
  idSys: string;
  typeId: number;
  ready: boolean;
  planId: number;
  name: string;
  textFromSign: string | null;
  additionalInfo: string | null;
  comments: string | null;
  link: string | null;
  type?: NavType | null;
  plan?: NavPlan | null;
  photos?: NavAuditoryPhoto[] | null;
}

export interface NavType {
  id: number;
  name: string;
}

export interface NavLocationUpdateInput {
  idSys?: string;
  name?: string;
  short?: string;
  ready?: boolean;
  address?: string;
  metro?: string;
  comments?: string | null;
  crossings?: string | null;
}

export interface NavLocationCreateInput {
  idSys: string;
  name: string;
  short: string;
  ready: boolean;
  address: string;
  metro: string;
  comments?: string | null;
  crossings?: string | null;
}

// ============================================================================
// НАВИГАЦИЯ (Корпуса)
// ============================================================================

export interface NavCampus {
  id: number;
  idSys: string;
  locId: number;
  name: string;
  ready: boolean;
  stairGroups: string | null;
  comments: string | null;
  location?: NavLocation;
}

export interface NavCampusConnection {
  nodes: NavCampus[];
  pageInfo: PageInfo;
  paginationInfo: PaginationInfo;
}

export interface NavCampusUpdateInput {
  idSys?: string;
  locId?: number;
  name?: string;
  ready?: boolean;
  // stairGroups?: string | null;
  comments?: string | null;
}

export interface NavCampusCreateInput {
  idSys: string;
  locId: number;
  name: string;
  ready: boolean;
  stairGroups?: string | null;
  comments?: string | null;
}

// ============================================================================
// НАВИГАЦИЯ (планы)
// ============================================================================

export interface NavPlan {
  id: number;
  idSys: string;
  corId: number;
  floorId: number;
  ready: boolean;
  entrances: string | null;
  graph: string | null;
  svgId: number | null;
  nearestEntrance: string | null;
  nearestManWc: string | null;
  nearestWomanWc: string | null;
  nearestSharedWc: string | null;
  campus?: NavCampus;
  floor?: NavFloor;
  svg?: NavStatic;
}

export interface NavPlanConnection {
  nodes: NavPlan[];
  pageInfo: PageInfo;
  paginationInfo: PaginationInfo;
}

export interface NavPlanUpdateInput {
  idSys?: string;
  corId?: number;
  floorId?: number;
  ready?: boolean;
  entrances?: string | null;
  graph?: string | null;
  svgId?: number | null;
  nearestEntrance?: string | null;
  nearestManWc?: string | null;
  nearestWomanWc?: string | null;
  nearestSharedWc?: string | null;
}

export interface NavPlanCreateInput {
  idSys: string;
  corId: number;
  floorId: number;
  ready: boolean;
  entrances?: string | null;
  graph?: string | null;
  // svgId?: number | null;
  nearestEntrance?: string | null;
  nearestManWc?: string | null;
  nearestWomanWc?: string | null;
  nearestSharedWc?: string | null;
}

// ============================================================================
// НАВИГАЦИЯ (этажи)
// ============================================================================

export interface NavFloor {
  id: number;
  name: number;
}

export interface NavFloorConnection {
  nodes: NavFloor[];
  pageInfo: PageInfo;
  paginationInfo: PaginationInfo;
}

// ============================================================================
// НАВИГАЦИЯ (статические ресурсы - SVG)
// ============================================================================

export interface NavStatic {
  id: number;
  ext: string;
  path: string;
  name: string;
  link: string;
  creationDate: string | null;
  updateDate: string | null;
}

export interface NavStaticConnection {
  nodes: NavStatic[];
  pageInfo: PageInfo;
  paginationInfo: PaginationInfo;
}

// ============================================================================
// НАВИГАЦИЯ (аудитории)
// ============================================================================

export interface NavAuditoryPhoto {
  id: number;
  audId: number;
  ext: string;
  name: string;
  path: string;
  link: string;
  creationDate: string | null;
  updateDate: string | null;
}

export interface NavAuditoryConnection {
  nodes: NavAuditory[];
  pageInfo: PageInfo;
  paginationInfo: PaginationInfo;
}

export interface NavAuditoryUpdateInput {
  idSys?: string;
  typeId?: number;
  ready?: boolean;
  planId?: number;
  name?: string;
  textFromSign?: string | null;
  additionalInfo?: string | null;
  comments?: string | null;
  link?: string | null;
}

export interface NavAuditoryCreateInput {
  idSys: string;
  typeId: number;
  ready: boolean;
  planId: number;
  name: string;
  textFromSign?: string | null;
  additionalInfo?: string | null;
  comments?: string | null;
  link?: string | null;
}

export interface AllowedPermissionsResponse {
  allowed_permissions: Record<string, number[]>;
}

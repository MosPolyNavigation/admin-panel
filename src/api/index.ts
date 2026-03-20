// Клиент
export { graphqlClient, restClient } from './client.ts';

// Типы
export type {
  // Общие
  PageInfo,
  PaginationInfo,
  PaginationInput,
  DeleteResult,
  GqlResponse,
  // Пользователи и роли
  Role,
  Right,
  Goal,
  RoleRightGoal,
  RoleRightGoalInput,
  UserRole,
  User,
  UserFilterInput,
  CreateUserInput,
  UpdateUserInput,
  ChangeUserPasswordInput,
  GrantRoleInput,
  RoleFilterInput,
  CreateRoleInput,
  UpdateRoleInput,
  UserConnection,
  UserRoleConnection,
  RoleConnection,
  GrantRoleResult,
  // Отзывы
  Review,
  ReviewStatus,
  SetReviewStatusResponse,
  // Статистика
  DateFilterType,
  EndpointStatistics,
  AggregatedEndpointStats,
  // Баны
  BanInfo,
  BanListResponse,
  UnbanRequest,
  UnbanResponse,
} from './types.ts';

// Пользователи
export {
  getUsers,
  getUser,
  createUser,
  updateUser,
  deleteUser,
  changeUserPassword,
  changeUserPasswordRest,
  grantRole,
  revokeRole,
} from './users.ts';

// Роли
export {
  getRoles,
  getRole,
  createRole,
  updateRole,
  deleteRole,
  getRights,
  getGoals,
  getUsersByRole,
} from './roles.ts';

// Отзывы
export {
  getReviews,
  getReview,
  getReviewStatuses,
  getReviewImageUrl,
  setReviewStatus,
  getReviewsBatch,
} from './reviews.ts';

// Статистика
export { getStat, getAllStats, getAllStatsAggregated } from './stats.ts';

// Баны
export { getBannedUsers, getBanInfo, unbanUser } from './bans.ts';

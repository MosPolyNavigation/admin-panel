export const STATUS_MAP: Record<number, string> = {
  1: 'бэклог',
  2: 'на рассмотрении',
  3: 'принят в работу',
  4: 'ждет проверки',
  5: 'исправлен',
  6: 'не требует исправления',
  7: 'исправление отложено',
};

export const STATUS_COLORS: Record<number, string> = {
  1: 'neutral',
  2: 'primary',
  3: 'warning',
  4: 'info',
  5: 'success',
  6: 'success',
  7: 'danger',
};

// Доступные права для каждой цели (из миграции)
export const GOAL_RIGHTS_MAP: Record<number, number[]> = {
  1: [1], // stats: view
  2: [1], // dashboards: view
  3: [1, 2, 3, 4], // users: view, create, edit, delete
  4: [1, 2, 3, 4, 5], // roles: view, create, edit, delete, grant
  5: [1, 3], // tables: view, edit
  6: [1, 2, 3, 4], // resources: view, create, edit, delete
  7: [1, 3], // tasks: view, edit
  8: [1, 2, 3, 4], // nav_data: view, create, edit, delete
  9: [3], // user_pass: edit
  10: [1, 3], // admin: view, edit
  11: [1, 3], // reviews: view, edit
};

// Названия прав
export const RIGHT_NAMES: Record<number, string> = {
  1: 'view',
  2: 'create',
  3: 'edit',
  4: 'delete',
  5: 'grant',
};

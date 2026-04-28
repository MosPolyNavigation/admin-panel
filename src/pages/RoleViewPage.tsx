import { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router';
import {
  Typography,
  Box,
  Button,
  Stack,
  Card,
  CardContent,
  Divider,
  Alert,
  LinearProgress,
  Chip,
  Table,
  Sheet,
  IconButton,
} from '@mui/joy';
import {
  ArrowBack as BackIcon,
  Edit as EditIcon,
  Security as SecurityIcon,
  Group as UsersIcon,
  Visibility as ViewIcon,
  CheckCircle as ActiveIcon,
  Cancel as InactiveIcon,
} from '@mui/icons-material';
import Page from '../components/Page.tsx';
import PaginationControls, {
  type PaginationControlsProps,
} from '../components/PaginationControls.tsx';
import { useAuth } from '../hooks/useAuth.ts';
import { getRole, getUsersByRole, type Role, type User } from '../api';
import { RequirePermission } from '../components/RequirePermission.tsx';
import { GOAL_RIGHTS_MAP, RIGHT_NAMES } from '../constants';

const ITEMS_PER_PAGE = 10;

export default function RoleViewPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { loading: authLoading } = useAuth();

  // State
  const [role, setRole] = useState<Role | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Users with this role
  const [users, setUsers] = useState<User[]>([]);
  const [usersLoading, setUsersLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  // Load role
  useEffect(() => {
    const loadRole = async () => {
      if (!id) return;
      setLoading(true);
      try {
        const result = await getRole(parseInt(id));
        if (result) {
          setRole(result);
        } else {
          setError('Роль не найдена');
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Ошибка загрузки роли');
      } finally {
        setLoading(false);
      }
    };
    loadRole();
  }, [id]);

  // Load users with this role
  useEffect(() => {
    const loadUsers = async () => {
      if (!id) return;
      setUsersLoading(true);
      try {
        const result = await getUsersByRole(parseInt(id), {
          limit: ITEMS_PER_PAGE,
          offset: (currentPage - 1) * ITEMS_PER_PAGE,
        });
        setUsers(result.nodes.map((ur) => ur.user).filter(Boolean) as User[]);
        setTotalCount(result.paginationInfo.totalCount);
        setTotalPages(result.paginationInfo.totalPages);
      } catch (err) {
        console.error('Ошибка загрузки пользователей:', err);
      } finally {
        setUsersLoading(false);
      }
    };
    loadUsers();
  }, [id, currentPage]);

  // Handle page change for users
  const handlePageChange: PaginationControlsProps['onPageChange'] = (page) => {
    setCurrentPage(page);
  };

  // Handle back navigation
  const handleBack = () => {
    const from = searchParams.get('from') || '/roles';
    const returnParams = new URLSearchParams();
    for (const [key, value] of searchParams.entries()) {
      if (key !== 'from') {
        returnParams.set(key, value);
      }
    }
    const query = returnParams.toString();
    navigate(query ? `${from}?${query}` : from);
  };

  // Format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ru-RU', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
  };

  // Show loading while auth is checking
  if (authLoading) {
    return (
      <Page headerText="Загрузка...">
        <LinearProgress />
      </Page>
    );
  }

  if (loading) {
    return (
      <Page headerText="Загрузка...">
        <LinearProgress />
      </Page>
    );
  }

  if (!role || error) {
    return (
      <Page headerText="Роль не найдена">
        <Alert color="danger" variant="soft" sx={{ mb: 2 }}>
          {error || 'Роль не найдена'}
        </Alert>
        <Button onClick={handleBack} startDecorator={<BackIcon />}>
          Назад к списку
        </Button>
      </Page>
    );
  }

  return (
    <Page headerText={`Роль: ${role.name}`}>
      {/* Error */}
      {error && (
        <Alert color="danger" variant="soft" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
        <Button variant="outlined" startDecorator={<BackIcon />} onClick={handleBack}>
          Назад
        </Button>
        <Typography level="h3">{role.name}</Typography>
        <Chip size="sm" variant="soft" color="primary">
          ID: {role.id}
        </Chip>
        <RequirePermission goal="roles" right="edit">
          <Button
            variant="outlined"
            startDecorator={<EditIcon />}
            onClick={() => {
              const returnParams = new URLSearchParams();
              for (const [key, value] of searchParams.entries()) {
                if (key !== 'from') {
                  returnParams.set(key, value);
                }
              }
              const query = returnParams.toString();
              navigate(query ? `/roles/${role.id}/edit?${query}` : `/roles/${role.id}/edit`);
            }}
          >
            Редактировать
          </Button>
        </RequirePermission>
      </Box>

      <Stack spacing={3}>
        {/* Rights Card */}
        <Card variant="outlined">
          <CardContent>
            <Typography level="title-lg" sx={{ mb: 2 }}>
              Права доступа
            </Typography>
            <Divider sx={{ mb: 3 }} />

            <Stack spacing={2}>
              {Object.entries(GOAL_RIGHTS_MAP).map(([goalId, availableRights]) => {
                const goalName = role.roleRightGoals?.find((rrg) => rrg.goalId === parseInt(goalId))
                  ?.goal?.name;

                if (!goalName) return null;

                const selectedGoalRights =
                  role.roleRightGoals
                    ?.filter((rrg) => rrg.goalId === parseInt(goalId))
                    .map((rrg) => rrg.rightId) || [];

                return (
                  <Card
                    key={goalId}
                    variant="outlined"
                    sx={{
                      borderColor: selectedGoalRights.length > 0 ? 'primary.500' : 'neutral.500',
                      bgcolor: selectedGoalRights.length > 0 ? 'primary.softBg' : 'transparent',
                    }}
                  >
                    <CardContent>
                      <Box
                        sx={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          mb: 2,
                        }}
                      >
                        <Typography level="title-md">
                          <SecurityIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                          {goalName}
                        </Typography>
                        <Chip size="sm" variant="soft" color="neutral">
                          {selectedGoalRights.length} из {availableRights.length}
                        </Chip>
                      </Box>

                      <Stack direction="row" spacing={1} flexWrap="wrap">
                        {availableRights.map((rightId) => {
                          const isSelected = selectedGoalRights.includes(rightId);

                          return (
                            <Chip
                              key={rightId}
                              size="md"
                              variant={isSelected ? 'solid' : 'outlined'}
                              color={isSelected ? 'primary' : 'neutral'}
                              sx={{ cursor: 'default' }}
                            >
                              {RIGHT_NAMES[rightId] || rightId}
                            </Chip>
                          );
                        })}
                      </Stack>
                    </CardContent>
                  </Card>
                );
              })}
            </Stack>
          </CardContent>
        </Card>

        {/* Users Card */}
        <RequirePermission goal="users" right="view">
          <Card variant="outlined">
            <CardContent>
              <Typography level="title-lg" sx={{ mb: 2 }}>
                Пользователи с этой ролью
              </Typography>
              <Divider sx={{ mb: 3 }} />

              {usersLoading ? (
                <LinearProgress />
              ) : users.length > 0 ? (
                <>
                  <Sheet variant="soft" sx={{ borderRadius: 'sm', overflow: 'auto', mb: 2 }}>
                    <Table stickyHeader size="sm">
                      <thead>
                        <tr>
                          <th style={{ padding: '8px', width: '10%' }}>ID</th>
                          <th style={{ padding: '8px', width: '25%' }}>Логин</th>
                          <th style={{ padding: '8px', width: '25%' }}>ФИО</th>
                          <th style={{ padding: '8px', width: '20%' }}>Дата регистрации</th>
                          <th style={{ padding: '8px', width: '10%' }}>Статус</th>
                          <th style={{ padding: '8px', width: '10%', textAlign: 'right' }}>
                            Действия
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {users.map((user) => (
                          <tr key={user.id}>
                            <td style={{ padding: '8px' }}>
                              <Typography level="body-sm">{user.id}</Typography>
                            </td>
                            <td style={{ padding: '8px' }}>
                              <Typography level="body-sm" fontWeight="md">
                                {user.login}
                              </Typography>
                            </td>
                            <td style={{ padding: '8px' }}>
                              <Typography level="body-sm">{user.fio || '—'}</Typography>
                            </td>
                            <td style={{ padding: '8px' }}>
                              <Typography level="body-sm">
                                {formatDate(user.registrationDate)}
                              </Typography>
                            </td>
                            <td style={{ padding: '8px' }}>
                              <Chip
                                size="sm"
                                variant="soft"
                                color={user.isActive ? 'success' : 'danger'}
                                startDecorator={user.isActive ? <ActiveIcon /> : <InactiveIcon />}
                              >
                                {user.isActive ? 'Активен' : 'Неактивен'}
                              </Chip>
                            </td>
                            <td style={{ padding: '8px', textAlign: 'right' }}>
                              <IconButton
                                size="sm"
                                color="primary"
                                variant="outlined"
                                onClick={() => navigate(`/users/${user.id}`)}
                                title="Просмотр"
                              >
                                <ViewIcon />
                              </IconButton>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </Table>
                  </Sheet>

                  <PaginationControls
                    currentPage={currentPage}
                    totalPages={totalPages}
                    totalItems={totalCount}
                    itemsPerPage={ITEMS_PER_PAGE}
                    onPageChange={handlePageChange}
                    showInfo={true}
                    compact={false}
                  />
                </>
              ) : (
                <Box sx={{ p: 3, textAlign: 'center' }}>
                  <UsersIcon sx={{ fontSize: 48, color: 'neutral.400', mb: 2 }} />
                  <Typography level="body-md" color="neutral">
                    Нет пользователей с этой ролью
                  </Typography>
                </Box>
              )}
            </CardContent>
          </Card>
        </RequirePermission>

        {/* Info Alert */}
        <Alert color="primary" variant="soft">
          <Typography level="body-sm">
            Для изменения прав роли используйте кнопку "Редактировать". Для назначения или отзыва
            роли у пользователей перейдите на страницу управления пользователями.
          </Typography>
        </Alert>
      </Stack>
    </Page>
  );
}

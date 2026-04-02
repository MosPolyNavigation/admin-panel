import { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router';
import {
  Typography,
  Box,
  Button,
  Stack,
  Card,
  CardContent,
  Input,
  FormControl,
  FormLabel,
  Divider,
  Alert,
  LinearProgress,
  Chip,
} from '@mui/joy';
import {
  ArrowBack as BackIcon,
  Save as SaveIcon,
  Cancel as CancelIcon,
  Security as SecurityIcon,
  Add as AddIcon,
  Remove as RemoveIcon,
} from '@mui/icons-material';
import Page from '../components/Page.tsx';
import { useAuth } from '../hooks/useAuth.ts';
import { getRole, updateRole, getRights, getGoals, type Right, type Goal, type Role } from '../api';
import { GOAL_RIGHTS_MAP, RIGHT_NAMES } from '../constants';

export default function RoleEditPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { token, loading: authLoading } = useAuth();

  // State
  const [role, setRole] = useState<Role | null>(null);
  const [loading, setLoading] = useState(false);
  const [dataLoading, setDataLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notification, setNotification] = useState<string | null>(null);
  const [notificationType, setNotificationType] = useState<'success' | 'danger'>('success');

  // Form data
  const [roleName, setRoleName] = useState('');
  const [selectedRights, setSelectedRights] = useState<Record<number, number[]>>({});

  // Data
  const [rights, setRights] = useState<Right[]>([]);
  const [goals, setGoals] = useState<Goal[]>([]);

  // Load role, rights and goals
  useEffect(() => {
    const loadData = async () => {
      if (!token || !id) return;
      setDataLoading(true);
      try {
        const [roleData, rightsData, goalsData] = await Promise.all([
          getRole(token, parseInt(id)),
          getRights(token),
          getGoals(token),
        ]);

        if (!roleData) {
          setError('Роль не найдена');
          return;
        }

        setRole(roleData);
        setRoleName(roleData.name);
        setRights(rightsData);
        setGoals(goalsData);

        // Загружаем выбранные права из роли
        const initialRights: Record<number, number[]> = {};
        roleData.roleRightGoals?.forEach((rrg) => {
          if (!initialRights[rrg.goalId]) {
            initialRights[rrg.goalId] = [];
          }
          initialRights[rrg.goalId].push(rrg.rightId);
        });
        setSelectedRights(initialRights);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Ошибка загрузки данных');
      } finally {
        setDataLoading(false);
      }
    };
    loadData();
  }, [id, token]);

  // Show notification
  const showNotification = (message: string, type: 'success' | 'danger' = 'success') => {
    setNotification(message);
    setNotificationType(type);
    setTimeout(() => setNotification(null), 4000);
  };

  // Handle right toggle
  const toggleRight = (goalId: number, rightId: number) => {
    setSelectedRights((prev) => {
      const goalRights = prev[goalId] || [];
      const newGoalRights = goalRights.includes(rightId)
        ? goalRights.filter((rId) => rId !== rightId)
        : [...goalRights, rightId];
      return { ...prev, [goalId]: newGoalRights };
    });
  };

  // Handle update
  const update = async () => {
    if (!token || !id) return;
    if (!roleName.trim()) {
      showNotification('Название роли обязательно', 'danger');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      // Собираем все выбранные права
      const roleRightGoals: { rightId: number; goalId: number }[] = [];
      Object.entries(selectedRights).forEach(([goalId, rightIds]) => {
        rightIds.forEach((rightId) => {
          roleRightGoals.push({ rightId, goalId: parseInt(goalId) });
        });
      });

      await updateRole(token, parseInt(id), {
        name: roleName.trim(),
        roleRightGoals: roleRightGoals.length > 0 ? roleRightGoals : undefined,
      });

      showNotification('Роль успешно обновлена', 'success');

      // Возвращаемся на страницу ролей с сохранением параметров
      const from = searchParams.get('from') || '/roles';
      const returnParams = new URLSearchParams();
      for (const [key, value] of searchParams.entries()) {
        if (key !== 'from') {
          returnParams.set(key, value);
        }
      }
      const query = returnParams.toString();
      navigate(query ? `${from}?${query}` : from);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Ошибка обновления роли';
      setError(message);
      showNotification(message, 'danger');
    } finally {
      setLoading(false);
    }
  };

  // Handle cancel
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

  const cancel = () => {
    handleBack();
  };

  // Show loading while auth is checking
  if (authLoading) {
    return (
      <Page headerText="Загрузка...">
        <LinearProgress />
      </Page>
    );
  }

  // Show message if not authenticated
  if (!token) {
    return (
      <Page headerText="Требуется авторизация">
        <Alert color="danger" variant="soft">
          Требуется авторизация для доступа к этой странице
        </Alert>
        <Button onClick={handleBack} startDecorator={<BackIcon />}>
          Назад
        </Button>
      </Page>
    );
  }

  if (dataLoading) {
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
    <Page headerText="Редактирование роли">
      {/* Notification */}
      {notification && (
        <Alert color={notificationType} variant="soft" sx={{ mb: 2 }}>
          {notification}
        </Alert>
      )}

      {/* Error */}
      {error && (
        <Alert color="danger" variant="soft" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {/* Loading indicator */}
      {loading && <LinearProgress />}

      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
        <Button variant="outlined" startDecorator={<BackIcon />} onClick={handleBack}>
          Назад
        </Button>
        <Typography level="h3">Редактирование роли</Typography>
        <Chip size="sm" variant="soft" color="primary">
          ID: {role.id}
        </Chip>
      </Box>

      <Stack spacing={3}>
        {/* Role Name Card */}
        <Card variant="outlined">
          <CardContent>
            <Typography level="title-lg" sx={{ mb: 2 }}>
              Основная информация
            </Typography>
            <Divider sx={{ mb: 3 }} />

            <FormControl>
              <FormLabel>Название роли *</FormLabel>
              <Input
                value={roleName}
                onChange={(e) => setRoleName(e.target.value)}
                placeholder="Например: Менеджер"
                disabled={loading}
                sx={{ maxWidth: 400 }}
              />
            </FormControl>
          </CardContent>
        </Card>

        {/* Rights Assignment Card */}
        <Card variant="outlined">
          <CardContent>
            <Typography level="title-lg" sx={{ mb: 2 }}>
              Права доступа
            </Typography>
            <Divider sx={{ mb: 3 }} />

            <Stack spacing={2}>
              {goals.map((goal) => {
                const availableRights = GOAL_RIGHTS_MAP[goal.id] || [];
                const selectedGoalRights = selectedRights[goal.id] || [];

                return (
                  <Card
                    key={goal.id}
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
                          {goal.name}
                        </Typography>
                        <Chip size="sm" variant="soft" color="neutral">
                          {selectedGoalRights.length} из {availableRights.length}
                        </Chip>
                      </Box>

                      <Stack direction="row" spacing={1} flexWrap="wrap">
                        {availableRights.map((rightId) => {
                          const right = rights.find((r) => r.id === rightId);
                          const isSelected = selectedGoalRights.includes(rightId);

                          return (
                            <Chip
                              key={rightId}
                              size="md"
                              variant={isSelected ? 'solid' : 'outlined'}
                              color={isSelected ? 'primary' : 'neutral'}
                              onClick={() => toggleRight(goal.id, rightId)}
                              sx={{ cursor: 'pointer' }}
                              startDecorator={
                                isSelected ? (
                                  <RemoveIcon sx={{ fontSize: 16 }} />
                                ) : (
                                  <AddIcon sx={{ fontSize: 16 }} />
                                )
                              }
                            >
                              {right?.name || RIGHT_NAMES[rightId] || rightId}
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

        {/* Info Alert */}
        <Alert color="primary" variant="soft">
          <Typography level="body-sm">
            Измените права для каждой цели. Вы можете назначать только те права, которые есть у вас.
          </Typography>
        </Alert>

        {/* Action Buttons */}
        <Box sx={{ mt: 4, pt: 3, borderTop: '1px solid', borderColor: 'divider' }}>
          <Stack direction="row" spacing={2} justifyContent="flex-end">
            <Button
              startDecorator={<CancelIcon />}
              onClick={cancel}
              variant="outlined"
              color="neutral"
              size="lg"
              disabled={loading}
            >
              Отменить
            </Button>
            <Button
              startDecorator={<SaveIcon />}
              onClick={update}
              variant="solid"
              color="primary"
              size="lg"
              loading={loading}
            >
              Сохранить
            </Button>
          </Stack>
        </Box>
      </Stack>
    </Page>
  );
}

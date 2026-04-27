import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router';
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
import { createRole, getRights, getGoals, type Right, type Goal } from '../api';
import { GOAL_RIGHTS_MAP, RIGHT_NAMES } from '../constants';

export default function RoleCreatePage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { token, loading: authLoading } = useAuth();

  // State
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

  // Load rights and goals
  useEffect(() => {
    const loadData = async () => {
      if (!token) return;
      setDataLoading(true);
      try {
        const [rightsData, goalsData] = await Promise.all([getRights(token), getGoals(token)]);
        setRights(rightsData);
        setGoals(goalsData);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Ошибка загрузки данных');
      } finally {
        setDataLoading(false);
      }
    };
    loadData();
  }, [token]);

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
        ? goalRights.filter((id) => id !== rightId)
        : [...goalRights, rightId];
      return { ...prev, [goalId]: newGoalRights };
    });
  };

  // Handle create
  const create = async () => {
    if (!token) return;
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

      await createRole(token, {
        name: roleName.trim(),
        roleRightGoals: roleRightGoals.length > 0 ? roleRightGoals : undefined,
      });

      showNotification('Роль успешно создана', 'success');

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
      const message = err instanceof Error ? err.message : 'Ошибка создания роли';
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

  return (
    <Page headerText="Создание роли">
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
        <Typography level="h3">Создание новой роли</Typography>
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
            Выберите права для каждой цели. Вы можете назначать только те права, которые есть у вас.
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
              onClick={create}
              variant="solid"
              color="primary"
              size="lg"
              loading={loading}
            >
              Создать
            </Button>
          </Stack>
        </Box>
      </Stack>
    </Page>
  );
}

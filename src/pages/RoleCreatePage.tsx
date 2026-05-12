import { useState, useEffect, useCallback } from 'react';
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
} from '@mui/joy';
import { ArrowBack as BackIcon, Save as SaveIcon, Cancel as CancelIcon } from '@mui/icons-material';
import Page from '../components/Page.tsx';
import { useAuth } from '../hooks/useAuth.ts';
import { createRole, getAllowedPermissions, getGoals, type Goal } from '../api';
import { RoleRightsList } from '../components/RoleRightsList';
import { RIGHT_NAMES } from '../constants';

export default function RoleCreatePage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user, loading: authLoading } = useAuth();
  const rightsByGoals = user?.rights_by_goals || {};

  // State
  const [loading, setLoading] = useState(false);
  const [dataLoading, setDataLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notification, setNotification] = useState<string | null>(null);
  const [notificationType, setNotificationType] = useState<'success' | 'danger'>('success');

  // Form data
  const [roleName, setRoleName] = useState('');

  const [allowedPermissions, setAllowedPermissions] = useState<Record<string, number[]>>({});
  const [goals, setGoals] = useState<Goal[]>([]);
  const [pendingChanges, setPendingChanges] = useState<
    Array<{
      rightId: number;
      goalId: number;
      selected: boolean;
      canGrant: boolean;
    }>
  >([]);

  useEffect(() => {
    const loadData = async () => {
      setDataLoading(true);
      try {
        const [goalsResult, permissionsResult] = await Promise.all([
          getGoals(),
          getAllowedPermissions(),
        ]);

        if (goalsResult.error) {
          setError(goalsResult.error);
          return;
        }
        if (permissionsResult.error) {
          console.warn('Не удалось загрузить разрешения:', permissionsResult.error);
        }

        setGoals(goalsResult.goals);
        if (permissionsResult.data?.allowed_permissions) {
          setAllowedPermissions(permissionsResult.data.allowed_permissions);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Ошибка загрузки данных');
      } finally {
        setDataLoading(false);
      }
    };
    loadData();
  }, []);

  const showNotification = (message: string, type: 'success' | 'danger' = 'success') => {
    setNotification(message);
    setNotificationType(type);
    setTimeout(() => setNotification(null), 4000);
  };

  const handleRightsChange = useCallback(
    (
      changes: Array<{
        rightId: number;
        goalId: number;
        selected: boolean;
        canGrant: boolean;
      }>
    ) => {
      setPendingChanges((prev) => {
        const updated = [...prev];
        changes.forEach(({ rightId, goalId, selected, canGrant }) => {
          const idx = updated.findIndex((c) => c.rightId === rightId && c.goalId === goalId);

          // 🔧 Всегда обновляем или добавляем, никогда не удаляем
          if (idx >= 0) {
            updated[idx] = { rightId, goalId, selected, canGrant };
          } else {
            updated.push({ rightId, goalId, selected, canGrant });
          }
        });
        return updated;
      });
    },
    []
  );

  // Handle create
  const create = async () => {
    if (!roleName.trim()) {
      showNotification('Название роли обязательно', 'danger');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const roleRightGoals = pendingChanges
        .filter((c) => c.selected)
        .map(({ rightId, goalId }) => ({
          rightId,
          goalId,
          canGrant: false,
        }));

      await createRole({
        name: roleName.trim(),
        roleRightGoals: roleRightGoals.length > 0 ? roleRightGoals : undefined,
      });

      showNotification('Роль успешно создана', 'success');

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

  const goalsMap = goals.reduce(
    (acc, goal) => {
      acc[goal.id] = goal.name;
      return acc;
    },
    {} as Record<number, string>
  );

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
  if (authLoading || dataLoading) {
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

        <Card variant="outlined">
          <CardContent>
            <Typography level="title-lg" sx={{ mb: 2 }}>
              Права доступа
            </Typography>
            <Divider sx={{ mb: 3 }} />

            <RoleRightsList
              roleRightGoals={[]}
              allowedPermissions={allowedPermissions}
              rightNames={RIGHT_NAMES}
              goals={goalsMap}
              isEditable={true}
              rightsByGoals={rightsByGoals}
              pendingChanges={pendingChanges}
              onRightsChange={handleRightsChange}
            />
          </CardContent>
        </Card>

        {/* Info Alert */}
        <Alert color="primary" variant="soft">
          <Typography level="body-sm">
            Выберите права для каждой цели. Переключатель «Можно передавать» появится только для тех
            прав, которые вы можете делегировать.
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
              disabled={!roleName.trim() && pendingChanges.filter((c) => c.selected).length === 0}
            >
              Создать
            </Button>
          </Stack>
        </Box>
      </Stack>
    </Page>
  );
}

import { useState, useEffect, useCallback } from 'react';
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
import { ArrowBack as BackIcon, Save as SaveIcon, Cancel as CancelIcon } from '@mui/icons-material';
import Page from '../components/Page.tsx';
import { useAuth } from '../hooks/useAuth.ts';
import { getRole, updateRole, getAllowedPermissions, type Role, type RoleRightGoal } from '../api';
import { RoleRightsList } from '../components/RoleRightsList';
import { RIGHT_NAMES } from '../constants';

export default function RoleEditPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user, loading: authLoading } = useAuth();
  const rightsByGoals = user?.rights_by_goals || {};

  // State
  const [role, setRole] = useState<Role | null>(null);
  const [loading, setLoading] = useState(false);
  const [dataLoading, setDataLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notification, setNotification] = useState<string | null>(null);
  const [notificationType, setNotificationType] = useState<'success' | 'danger'>('success');

  // Form data
  const [roleName, setRoleName] = useState('');

  // 🔧 Права с бэкенда + изменения
  const [allowedPermissions, setAllowedPermissions] = useState<Record<string, number[]>>({});
  const [pendingChanges, setPendingChanges] = useState<
    Array<{
      rightId: number;
      goalId: number;
      selected: boolean;
      canGrant: boolean;
    }>
  >([]);

  // Load role and allowed permissions
  useEffect(() => {
    const loadData = async () => {
      if (!id) return;
      const roleId = parseInt(id);
      if (Number.isNaN(roleId)) {
        setError('Неверный ID роли');
        setDataLoading(false);
        return;
      }

      setDataLoading(true);
      try {
        // 🔧 Деструктурируем ответы
        const [roleResult, permissionsResult] = await Promise.all([
          getRole(roleId),
          getAllowedPermissions(),
        ]);

        if (roleResult.error) {
          setError(roleResult.error);
          return;
        }
        if (permissionsResult.error) {
          console.warn('Не удалось загрузить разрешения:', permissionsResult.error);
        }

        const roleData = roleResult.role;
        const permissionsData = permissionsResult.data;

        if (!roleData) {
          setError('Роль не найдена');
          return;
        }

        setRole(roleData);
        setRoleName(roleData.name);

        if (permissionsData?.allowed_permissions) {
          setAllowedPermissions(permissionsData.allowed_permissions);
        }

        // 🔧 Инициализируем pendingChanges из текущих прав роли
        const initialChanges =
          roleData.roleRightGoals?.map((rrg: RoleRightGoal) => ({
            rightId: rrg.rightId,
            goalId: rrg.goalId,
            selected: true,
            canGrant: rrg.canGrant,
          })) || [];
        setPendingChanges(initialChanges);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Ошибка загрузки данных');
      } finally {
        setDataLoading(false);
      }
    };
    loadData();
  }, [id]);

  // Show notification
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

          const finalCanGrant = selected ? canGrant : false;

          if (idx >= 0) {
            updated[idx] = { rightId, goalId, selected, canGrant: finalCanGrant };
          } else {
            updated.push({ rightId, goalId, selected, canGrant: finalCanGrant });
          }
        });
        return updated;
      });
    },
    []
  );

  // Handle update
  const update = async () => {
    if (!id || !role) return;
    if (!roleName.trim()) {
      showNotification('Название роли обязательно', 'danger');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const roleRightGoals = pendingChanges.map(({ rightId, goalId, canGrant }) => ({
        rightId,
        goalId,
        canGrant,
      }));

      const { role: updatedRole, error: updateError } = await updateRole(parseInt(id), {
        name: roleName.trim(),
        roleRightGoals: roleRightGoals.length > 0 ? roleRightGoals : undefined,
      });

      if (updateError || !updatedRole) {
        throw new Error(updateError || 'Ошибка обновления роли');
      }

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
  if (authLoading || dataLoading) {
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

        {/* 🔧 Rights Assignment - используем выделенный компонент */}
        <Card variant="outlined">
          <CardContent>
            <Typography level="title-lg" sx={{ mb: 2 }}>
              Права доступа
            </Typography>
            <Divider sx={{ mb: 3 }} />

            <RoleRightsList
              roleRightGoals={role.roleRightGoals || []}
              allowedPermissions={allowedPermissions}
              rightsByGoals={rightsByGoals}
              rightNames={RIGHT_NAMES}
              isEditable={true}
              pendingChanges={pendingChanges}
              onRightsChange={handleRightsChange}
            />
          </CardContent>
        </Card>

        {/* Info Alert */}
        <Alert color="primary" variant="soft">
          <Typography level="body-sm">
            Измените права для каждой цели. Переключатель «Можно передавать» позволяет делегировать
            это право другим ролям.
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
              disabled={pendingChanges.length === 0 && roleName === role.name}
            >
              Сохранить
            </Button>
          </Stack>
        </Box>
      </Stack>
    </Page>
  );
}

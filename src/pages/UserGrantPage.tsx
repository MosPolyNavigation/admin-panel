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
  Checkbox,
} from '@mui/joy';
import {
  ArrowBack as BackIcon,
  Save as SaveIcon,
  Cancel as CancelIcon,
  GroupAdd as RoleIcon,
  CheckCircle as ActiveIcon,
  Cancel as InactiveIcon,
} from '@mui/icons-material';
import Page from '../components/Page.tsx';
import { useAuth } from '../hooks/useAuth.ts';
import { getUser, getRoles, grantRole, revokeRole, type User, type Role } from '../api';

export default function UserGrantPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { token, loading: authLoading } = useAuth();

  // State
  const [user, setUser] = useState<User | null>(null);
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notification, setNotification] = useState<string | null>(null);
  const [notificationType, setNotificationType] = useState<'success' | 'danger'>('success');

  // Selected roles (IDs)
  const [selectedRoleIds, setSelectedRoleIds] = useState<number[]>([]);
  const [initialRoleIds, setInitialRoleIds] = useState<number[]>([]);

  // Load user and roles
  useEffect(() => {
    const loadData = async () => {
      if (!token || !id) return;
      setLoading(true);
      try {
        const [userData, rolesData] = await Promise.all([
          getUser(token, parseInt(id)),
          getRoles(token, { limit: 100, offset: 0 }),
        ]);

        if (!userData) {
          setError('Пользователь не найден');
          return;
        }

        setUser(userData);
        setRoles(rolesData.nodes);

        // Загружаем текущие роли пользователя
        const currentRoleIds = userData.roles?.map((ur) => ur.roleId) || [];
        setSelectedRoleIds(currentRoleIds);
        setInitialRoleIds(currentRoleIds);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Ошибка загрузки данных');
      } finally {
        setLoading(false);
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

  // Handle role toggle
  const toggleRole = (roleId: number) => {
    setSelectedRoleIds((prev) =>
      prev.includes(roleId) ? prev.filter((id) => id !== roleId) : [...prev, roleId]
    );
  };

  // Handle save
  const save = async () => {
    if (!token || !id || !user) return;
    setSaving(true);
    setError(null);

    try {
      // Определяем какие роли добавить, а какие удалить
      const rolesToAdd = selectedRoleIds.filter((id) => !initialRoleIds.includes(id));
      const rolesToRemove = initialRoleIds.filter((id) => !selectedRoleIds.includes(id));

      // Сначала удаляем роли
      for (const roleId of rolesToRemove) {
        await revokeRole(token, user.id, roleId);
      }

      // Затем добавляем новые роли (если есть)
      if (rolesToAdd.length > 0) {
        await grantRole(token, user.id, rolesToAdd);
      }

      showNotification(`Роли пользователя ${user.login} обновлены`, 'success');

      // Возвращаемся на страницу пользователя с сохранением параметров
      const from = searchParams.get('from') || '/users';
      const returnParams = new URLSearchParams();
      for (const [key, value] of searchParams.entries()) {
        if (key !== 'from') {
          returnParams.set(key, value);
        }
      }
      const query = returnParams.toString();
      navigate(query ? `${from}?${query}` : from);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Ошибка обновления ролей';
      setError(message);
      showNotification(message, 'danger');
    } finally {
      setSaving(false);
    }
  };

  // Handle cancel
  const handleBack = () => {
    const from = searchParams.get('from') || '/users';
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

  if (loading) {
    return (
      <Page headerText="Загрузка...">
        <LinearProgress />
      </Page>
    );
  }

  if (!user || error) {
    return (
      <Page headerText="Пользователь не найден">
        <Alert color="danger" variant="soft" sx={{ mb: 2 }}>
          {error || 'Пользователь не найден'}
        </Alert>
        <Button onClick={handleBack} startDecorator={<BackIcon />}>
          Назад к списку
        </Button>
      </Page>
    );
  }

  return (
    <Page headerText={`Назначение ролей: ${user.login}`}>
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

      {/* Saving indicator */}
      {saving && <LinearProgress />}

      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
        <Button variant="outlined" startDecorator={<BackIcon />} onClick={handleBack}>
          Назад
        </Button>
        <Typography level="h3">Назначение ролей</Typography>
        <Chip
          variant="soft"
          color={user.isActive ? 'success' : 'danger'}
          startDecorator={user.isActive ? <ActiveIcon /> : <InactiveIcon />}
        >
          {user.isActive ? 'Активен' : 'Неактивен'}
        </Chip>
      </Box>

      <Stack spacing={3}>
        {/* User Info Card */}
        <Card variant="outlined">
          <CardContent>
            <Typography level="title-lg" sx={{ mb: 2 }}>
              Информация о пользователе
            </Typography>
            <Divider sx={{ mb: 3 }} />

            <Stack spacing={2}>
              <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 3 }}>
                <Box>
                  <Typography level="body-sm" textColor="neutral.500">
                    ID пользователя
                  </Typography>
                  <Typography level="title-md">{user.id}</Typography>
                </Box>

                <Box>
                  <Typography level="body-sm" textColor="neutral.500">
                    Логин
                  </Typography>
                  <Typography level="title-md">{user.login}</Typography>
                </Box>

                <Box>
                  <Typography level="body-sm" textColor="neutral.500">
                    ФИО
                  </Typography>
                  <Typography level="title-md">{user.fio || '—'}</Typography>
                </Box>

                <Box>
                  <Typography level="body-sm" textColor="neutral.500">
                    Текущие роли
                  </Typography>
                  <Stack direction="row" spacing={0.5} flexWrap="wrap" sx={{ mt: 0.5 }}>
                    {user.roles && user.roles.length > 0 ? (
                      user.roles.map((ur) => (
                        <Chip key={ur.roleId} size="sm" variant="soft" color="primary">
                          {ur.role?.name || `Role ${ur.roleId}`}
                        </Chip>
                      ))
                    ) : (
                      <Typography level="body-sm" textColor="neutral.500">
                        Нет ролей
                      </Typography>
                    )}
                  </Stack>
                </Box>
              </Box>
            </Stack>
          </CardContent>
        </Card>

        {/* Roles Assignment Card */}
        <Card variant="outlined">
          <CardContent>
            <Typography level="title-lg" sx={{ mb: 2 }}>
              Доступные роли
            </Typography>
            <Divider sx={{ mb: 3 }} />

            {roles.length > 0 ? (
              <Stack spacing={1}>
                {roles.map((role) => {
                  const isSelected = selectedRoleIds.includes(role.id);
                  const isInitiallySelected = initialRoleIds.includes(role.id);
                  const isChanged = isSelected !== isInitiallySelected;

                  return (
                    <Box
                      key={role.id}
                      onClick={() => toggleRole(role.id)}
                      sx={{
                        p: 2,
                        borderRadius: 'sm',
                        border: '1px solid',
                        borderColor: isSelected ? 'primary.500' : 'neutral.500',
                        bgcolor: isSelected ? 'primary.softBg' : 'transparent',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 2,
                        '&:hover': {
                          bgcolor: isSelected ? 'primary.softHoverBg' : 'neutral.hoverBg',
                        },
                      }}
                    >
                      <Checkbox
                        checked={isSelected}
                        onChange={() => toggleRole(role.id)}
                        sx={{ pointerEvents: 'none' }}
                      />
                      <Box sx={{ flex: 1 }}>
                        <Typography level="title-md">{role.name}</Typography>
                        <Typography level="body-sm" textColor="neutral.500">
                          ID: {role.id}
                        </Typography>
                      </Box>
                      {isChanged && (
                        <Chip size="sm" variant="soft" color={isSelected ? 'success' : 'warning'}>
                          {isSelected ? 'Добавлена' : 'Удалена'}
                        </Chip>
                      )}
                    </Box>
                  );
                })}
              </Stack>
            ) : (
              <Box sx={{ p: 3, textAlign: 'center' }}>
                <RoleIcon sx={{ fontSize: 48, color: 'neutral.400', mb: 2 }} />
                <Typography level="body-md" color="neutral">
                  Нет доступных ролей
                </Typography>
              </Box>
            )}
          </CardContent>
        </Card>

        {/* Changes Summary */}
        {selectedRoleIds.length !== initialRoleIds.length && (
          <Alert color="primary" variant="soft">
            <Typography level="body-sm">
              Будет{' '}
              <strong>{selectedRoleIds.filter((id) => !initialRoleIds.includes(id)).length}</strong>{' '}
              добавлено и{' '}
              <strong>{initialRoleIds.filter((id) => !selectedRoleIds.includes(id)).length}</strong>{' '}
              удалено ролей.
            </Typography>
          </Alert>
        )}

        {/* Action Buttons */}
        <Box sx={{ mt: 4, pt: 3, borderTop: '1px solid', borderColor: 'divider' }}>
          <Stack direction="row" spacing={2} justifyContent="flex-end">
            <Button
              startDecorator={<CancelIcon />}
              onClick={cancel}
              variant="outlined"
              color="neutral"
              size="lg"
              disabled={saving}
            >
              Отменить
            </Button>
            <Button
              startDecorator={<SaveIcon />}
              onClick={save}
              variant="solid"
              color="primary"
              size="lg"
              loading={saving}
              disabled={selectedRoleIds.length === initialRoleIds.length}
            >
              Сохранить
            </Button>
          </Stack>
        </Box>
      </Stack>
    </Page>
  );
}

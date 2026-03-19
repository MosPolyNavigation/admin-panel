import { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router';
import {
  Typography,
  Box,
  Button,
  Stack,
  Card,
  CardContent,
  Chip,
  LinearProgress,
  Alert,
  Divider,
} from '@mui/joy';
import {
  ArrowBack as BackIcon,
  Edit as EditIcon,
  GroupAdd as RoleIcon,
  LockReset as PasswordIcon,
  CheckCircle as ActiveIcon,
  Cancel as InactiveIcon,
  Delete as DeleteIcon,
  CalendarToday as CalendarIcon,
  Update as UpdateIcon,
} from '@mui/icons-material';
import Page from '../components/Page.tsx';
import { useAuth } from '../hooks/useAuth.ts';
import { getUser, deleteUser, type User } from '../api.ts';
import { Modal, ModalClose, ModalDialog } from '@mui/joy';

export default function UserViewPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { token, loading: authLoading } = useAuth();

  // State
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notification, setNotification] = useState<string | null>(null);
  const [notificationType, setNotificationType] = useState<'success' | 'danger'>('success');

  // Delete modal
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);

  // Password modal
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [password, setPassword] = useState({ new: '', confirm: '' });
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [changingPassword, setChangingPassword] = useState(false);

  const handleBack = () => {
    const from = searchParams.get('from') || '/users';
    // Собираем параметры для возврата (исключая 'from')
    const returnParams = new URLSearchParams();
    for (const [key, value] of searchParams.entries()) {
      if (key !== 'from') {
        returnParams.set(key, value);
      }
    }
    const query = returnParams.toString();
    navigate(query ? `${from}?${query}` : from);
  };

  // Load user
  useEffect(() => {
    const loadUser = async () => {
      if (!id || !token) return;
      setLoading(true);
      try {
        const result = await getUser(token, parseInt(id));
        if (result) {
          setUser(result);
        } else {
          setError('Пользователь не найден');
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Ошибка загрузки');
      } finally {
        setLoading(false);
      }
    };
    loadUser();
  }, [id, token]);

  // Show notification
  const showNotification = (message: string, type: 'success' | 'danger' = 'success') => {
    setNotification(message);
    setNotificationType(type);
    setTimeout(() => setNotification(null), 4000);
  };

  // Handle delete
  const handleDelete = async () => {
    if (!user || !token) return;
    try {
      await deleteUser(token, user.id);
      showNotification(`Пользователь ${user.login} удалён`, 'success');
      navigate('/users');
    } catch (err) {
      showNotification(err instanceof Error ? err.message : 'Ошибка удаления', 'danger');
    } finally {
      setDeleteModalOpen(false);
    }
  };

  // Handle change password
  const changePassword = async () => {
    if (!user || !token) return;
    if (password.new !== password.confirm) {
      setPasswordError('Пароли не совпадают');
      return;
    }
    if (password.new.length < 8) {
      setPasswordError('Пароль должен содержать минимум 8 символов');
      return;
    }
    setChangingPassword(true);
    try {
      const { changeUserPassword } = await import('../api.ts');
      await changeUserPassword(token, user.id, password.new);
      setShowPasswordModal(false);
      setPassword({ new: '', confirm: '' });
      setPasswordError(null);
      showNotification('Пароль изменён', 'success');
    } catch (err) {
      setPasswordError(err instanceof Error ? err.message : 'Ошибка смены пароля');
    } finally {
      setChangingPassword(false);
    }
  };

  // Format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ru-RU', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
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

  // Show message if not authenticated
  if (!token) {
    return (
      <Page headerText="Требуется авторизация">
        <Alert color="danger" variant="soft">
          Требуется авторизация для доступа к этой странице
        </Alert>
        <Button onClick={() => navigate('/users')} startDecorator={<BackIcon />}>
          Назад к списку
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
        <Button onClick={() => navigate('/users')} startDecorator={<BackIcon />}>
          Назад к списку
        </Button>
      </Page>
    );
  }

  return (
    <Page headerText={`Пользователь: ${user.login}`}>
      {/* Notification */}
      {notification && (
        <Alert color={notificationType} variant="soft" sx={{ mb: 2 }}>
          {notification}
        </Alert>
      )}

      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
        <Button variant="outlined" startDecorator={<BackIcon />} onClick={handleBack}>
          Назад к списку
        </Button>
        <Typography level="h3">{user.login}</Typography>
        <Chip
          variant="soft"
          color={user.isActive ? 'success' : 'danger'}
          size="lg"
          startDecorator={user.isActive ? <ActiveIcon /> : <InactiveIcon />}
        >
          {user.isActive ? 'Активен' : 'Неактивен'}
        </Chip>
      </Box>

      <Stack spacing={3}>
        {/* Main Info Card */}
        <Card variant="outlined">
          <CardContent>
            <Typography level="title-lg" sx={{ mb: 2 }}>
              Основная информация
            </Typography>
            <Divider sx={{ mb: 3 }} />

            <Stack spacing={3}>
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
                    Статус
                  </Typography>
                  <Chip
                    size="sm"
                    variant="soft"
                    color={user.isActive ? 'success' : 'danger'}
                    startDecorator={user.isActive ? <ActiveIcon /> : <InactiveIcon />}
                  >
                    {user.isActive ? 'Активен' : 'Неактивен'}
                  </Chip>
                </Box>
              </Box>

              <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 3 }}>
                <Box>
                  <Typography
                    level="body-sm"
                    textColor="neutral.500"
                    sx={{ display: 'flex', alignItems: 'center', gap: 1 }}
                  >
                    <CalendarIcon fontSize="small" />
                    Дата регистрации
                  </Typography>
                  <Typography level="body-md">{formatDate(user.registrationDate)}</Typography>
                </Box>

                <Box>
                  <Typography
                    level="body-sm"
                    textColor="neutral.500"
                    sx={{ display: 'flex', alignItems: 'center', gap: 1 }}
                  >
                    <UpdateIcon fontSize="small" />
                    Последнее изменение
                  </Typography>
                  <Typography level="body-md">{formatDate(user.updatedAt)}</Typography>
                </Box>
              </Box>
            </Stack>
          </CardContent>
        </Card>

        {/* Roles Card */}
        <Card variant="outlined">
          <CardContent>
            <Typography level="title-lg" sx={{ mb: 2 }}>
              Роли пользователя
            </Typography>
            <Divider sx={{ mb: 3 }} />

            {user.roles && user.roles.length > 0 ? (
              <Stack direction="row" spacing={1} flexWrap="wrap">
                {user.roles.map((ur) => (
                  <Chip
                    key={ur.roleId}
                    size="md"
                    variant="soft"
                    color="primary"
                    startDecorator={<RoleIcon fontSize="small" />}
                  >
                    {ur.role?.name || `Role ${ur.roleId}`}
                  </Chip>
                ))}
              </Stack>
            ) : (
              <Typography level="body-md" textColor="neutral.500">
                Роли не назначены
              </Typography>
            )}
          </CardContent>
        </Card>

        {/* Account Management Card */}
        <Card variant="outlined">
          <CardContent>
            <Typography level="title-lg" sx={{ mb: 2 }}>
              Управление аккаунтом
            </Typography>
            <Divider sx={{ mb: 3 }} />

            <Stack spacing={2}>
              {/* Change Password */}
              <Box
                sx={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  p: 2,
                  borderRadius: 'sm',
                }}
              >
                <Box>
                  <Typography level="title-md">Смена пароля</Typography>
                  <Typography level="body-sm" textColor="neutral.500">
                    Изменить пароль пользователя
                  </Typography>
                </Box>
                <Button
                  variant="outlined"
                  startDecorator={<PasswordIcon />}
                  onClick={() => setShowPasswordModal(true)}
                >
                  Сменить пароль
                </Button>
              </Box>

              {/* Assign Roles */}
              <Box
                sx={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  p: 2,
                  borderRadius: 'sm',
                }}
              >
                <Box>
                  <Typography level="title-md">Назначение ролей</Typography>
                  <Typography level="body-sm" textColor="neutral.500">
                    Добавить или удалить роли
                  </Typography>
                </Box>
                <Button
                  variant="outlined"
                  startDecorator={<RoleIcon />}
                  onClick={() => {
                    const returnParams = new URLSearchParams();
                    for (const [key, value] of searchParams.entries()) {
                      if (key !== 'from') {
                        returnParams.set(key, value);
                      }
                    }
                    const query = returnParams.toString();
                    navigate(
                      query ? `/users/${user.id}/grant?${query}` : `/users/${user.id}/grant`
                    );
                  }}
                >
                  Управление ролями
                </Button>
              </Box>
            </Stack>
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <Box sx={{ mt: 4, pt: 3, borderTop: '1px solid', borderColor: 'divider' }}>
          <Stack direction="row" spacing={2} justifyContent="flex-end">
            <Button
              variant="outlined"
              color="neutral"
              size="lg"
              onClick={() => navigate(`/users/${user.id}/edit`)}
              startDecorator={<EditIcon />}
            >
              Редактировать
            </Button>
            <Button
              variant="outlined"
              color="danger"
              size="lg"
              onClick={() => setDeleteModalOpen(true)}
              startDecorator={<DeleteIcon />}
            >
              Удалить
            </Button>
          </Stack>
        </Box>
      </Stack>

      {/* Delete Modal */}
      <Modal open={deleteModalOpen} onClose={() => setDeleteModalOpen(false)}>
        <ModalDialog variant="outlined">
          <ModalClose />
          <Typography level="h4" sx={{ mb: 1 }}>
            Удалить пользователя?
          </Typography>
          <Typography level="body-md" textColor="neutral.500" sx={{ mb: 2 }}>
            Это действие нельзя отменить
          </Typography>
          <Divider sx={{ my: 2 }} />
          <Typography>
            Вы действительно хотите удалить пользователя <strong>{user.login}</strong>? Все
            связанные данные будут удалены.
          </Typography>
          <Stack direction="row" spacing={1} sx={{ mt: 3, justifyContent: 'flex-end' }}>
            <Button variant="outlined" onClick={() => setDeleteModalOpen(false)}>
              Отмена
            </Button>
            <Button color="danger" onClick={handleDelete}>
              Удалить
            </Button>
          </Stack>
        </ModalDialog>
      </Modal>

      {/* Password Change Modal */}
      {showPasswordModal && (
        <Modal open={showPasswordModal} onClose={() => setShowPasswordModal(false)}>
          <ModalDialog variant="outlined">
            <ModalClose />
            <Typography level="h4" sx={{ mb: 2 }}>
              Смена пароля
            </Typography>

            <Stack spacing={2}>
              <Box>
                <Typography level="body-sm" textColor="neutral.500" sx={{ mb: 1 }}>
                  Пользователь: <strong>{user.login}</strong>
                </Typography>
              </Box>

              <Box>
                <Typography level="body-sm" sx={{ mb: 1 }}>
                  Новый пароль
                </Typography>
                <input
                  type="password"
                  value={password.new}
                  onChange={(e) => {
                    setPassword({ ...password, new: e.target.value });
                    setPasswordError(null);
                  }}
                  placeholder="Минимум 8 символов"
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: '6px',
                    border: '1px solid var(--joy-palette-neutral-outlinedBorder)',
                    background: 'var(--joy-palette-neutral-softBg)',
                  }}
                />
              </Box>

              <Box>
                <Typography level="body-sm" sx={{ mb: 1 }}>
                  Подтверждение пароля
                </Typography>
                <input
                  type="password"
                  value={password.confirm}
                  onChange={(e) => {
                    setPassword({ ...password, confirm: e.target.value });
                    setPasswordError(null);
                  }}
                  placeholder="Повторите пароль"
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: '6px',
                    border: '1px solid var(--joy-palette-neutral-outlinedBorder)',
                    background: 'var(--joy-palette-neutral-softBg)',
                  }}
                />
              </Box>

              {passwordError && (
                <Alert color="danger" variant="soft">
                  {passwordError}
                </Alert>
              )}

              <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end', mt: 2 }}>
                <Button variant="outlined" onClick={() => setShowPasswordModal(false)}>
                  Отмена
                </Button>
                <Button variant="solid" onClick={changePassword} loading={changingPassword}>
                  Изменить
                </Button>
              </Box>
            </Stack>
          </ModalDialog>
        </Modal>
      )}
    </Page>
  );
}

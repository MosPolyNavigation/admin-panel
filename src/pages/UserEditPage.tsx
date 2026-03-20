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
  Switch,
  Divider,
  Alert,
  Chip,
  LinearProgress,
  Modal,
  ModalClose,
  ModalDialog,
} from '@mui/joy';
import {
  ArrowBack as BackIcon,
  Save as SaveIcon,
  Cancel as CancelIcon,
  LockReset as PasswordIcon,
  CheckCircle as ActiveIcon,
  Cancel as InactiveIcon,
} from '@mui/icons-material';
import Page from '../components/Page.tsx';
import { useAuth } from '../hooks/useAuth.ts';
import { getUser, updateUser, changeUserPassword, type User } from '../api';

export default function UserEditPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { token, loading: authLoading } = useAuth();

  // State
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notification, setNotification] = useState<string | null>(null);
  const [notificationType, setNotificationType] = useState<'success' | 'danger'>('success');

  // Form data
  const [formData, setFormData] = useState({
    fio: '',
    isActive: true,
  });

  // Password modal
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [password, setPassword] = useState({ new: '', confirm: '' });
  const [passwordError, setPasswordError] = useState<string | null>(null);

  // Handle back navigation with preserved state from URL params
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

  // Load user
  useEffect(() => {
    const loadUser = async () => {
      if (!id || !token) return;
      setLoading(true);
      try {
        const result = await getUser(token, parseInt(id));
        if (result) {
          setUser(result);
          setFormData({
            fio: result.fio || '',
            isActive: result.isActive,
          });
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

  // Handle form change
  const handleChange = (field: string) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [field]: e.target.value });
  };

  // Handle toggle active
  const toggleActive = () => {
    setFormData({ ...formData, isActive: !formData.isActive });
  };

  // Handle save
  const save = async () => {
    if (!id || !user || !token) return;
    setSaving(true);
    setError(null);
    try {
      await updateUser(token, user.id, formData);
      showNotification('Данные сохранены', 'success');
      // Reload user data
      const result = await getUser(token, user.id);
      if (result) {
        setUser(result);
        setFormData({
          fio: result.fio || '',
          isActive: result.isActive,
        });
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Ошибка сохранения';
      setError(message);
      showNotification(message, 'danger');
    } finally {
      setSaving(false);
    }
  };

  // Handle cancel
  const cancel = () => {
    if (user) {
      setFormData({
        fio: user.fio || '',
        isActive: user.isActive,
      });
    }
    showNotification('Изменения отменены', 'success');
  };

  // Handle change password
  const changePassword = async () => {
    if (!id || !user || !token) return;
    if (password.new !== password.confirm) {
      setPasswordError('Пароли не совпадают');
      return;
    }
    if (password.new.length < 8) {
      setPasswordError('Пароль должен содержать минимум 8 символов');
      return;
    }
    try {
      await changeUserPassword(token, user.id, password.new);
      setShowPasswordModal(false);
      setPassword({ new: '', confirm: '' });
      setPasswordError(null);
      showNotification('Пароль изменён', 'success');
    } catch (err) {
      setPasswordError(err instanceof Error ? err.message : 'Ошибка смены пароля');
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

  if (!user) {
    return (
      <Page headerText="Пользователь не найден">
        <Alert color="danger" variant="soft">
          {error || 'Пользователь не найден'}
        </Alert>
        <Button onClick={() => navigate('/users')} startDecorator={<BackIcon />}>
          Назад к списку
        </Button>
      </Page>
    );
  }

  return (
    <Page headerText={`Редактирование: ${user.login}`}>
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
        <Typography level="h3">Редактирование пользователя</Typography>
        <Chip
          variant="soft"
          color={user.isActive ? 'success' : 'danger'}
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

            <Stack spacing={2}>
              <FormControl>
                <FormLabel>ID пользователя</FormLabel>
                <Input value={user.id} disabled />
              </FormControl>

              <FormControl>
                <FormLabel>Логин</FormLabel>
                <Input value={user.login} disabled />
              </FormControl>

              <FormControl>
                <FormLabel>ФИО</FormLabel>
                <Input
                  value={formData.fio}
                  onChange={handleChange('fio')}
                  placeholder="Не указано"
                />
              </FormControl>

              <Stack direction="row" spacing={4}>
                <FormControl>
                  <FormLabel>Дата регистрации</FormLabel>
                  <Input value={formatDate(user.registrationDate)} disabled />
                </FormControl>

                <FormControl>
                  <FormLabel>Последнее изменение</FormLabel>
                  <Input value={formatDate(user.updatedAt)} disabled />
                </FormControl>
              </Stack>
            </Stack>
          </CardContent>
        </Card>

        {/* Account Management Card */}
        <Card variant="outlined">
          <CardContent>
            <Typography level="title-lg" sx={{ mb: 2 }}>
              Управление аккаунтом
            </Typography>
            <Divider sx={{ mb: 3 }} />

            <Stack spacing={3}>
              {/* Status */}
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography>Статус аккаунта</Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Switch checked={formData.isActive} onChange={toggleActive} />
                  <Button
                    variant={formData.isActive ? 'outlined' : 'solid'}
                    color={formData.isActive ? 'warning' : 'success'}
                    onClick={toggleActive}
                  >
                    {formData.isActive ? 'Деактивировать' : 'Активировать'}
                  </Button>
                </Box>
              </Box>

              {/* Password */}
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography>Смена пароля</Typography>
                <Button
                  variant="outlined"
                  startDecorator={<PasswordIcon />}
                  onClick={() => setShowPasswordModal(true)}
                >
                  Сменить пароль
                </Button>
              </Box>

              {/* Roles */}
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Box>
                  <Typography>Роли пользователя</Typography>
                  <Stack direction="row" spacing={1} sx={{ mt: 1 }}>
                    {user.roles && user.roles.length > 0 ? (
                      user.roles.map((ur) => (
                        <Chip key={ur.roleId} size="sm" variant="soft" color="primary">
                          {ur.role?.name || `Role ${ur.roleId}`}
                        </Chip>
                      ))
                    ) : (
                      <Typography level="body-sm" textColor="neutral.500">
                        Роли не назначены
                      </Typography>
                    )}
                  </Stack>
                </Box>
                <Button
                  variant="outlined"
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
                  Назначить роли
                </Button>
              </Box>
            </Stack>
          </CardContent>
        </Card>

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
            >
              Сохранить
            </Button>
          </Stack>
        </Box>
      </Stack>

      {/* Password Change Modal */}
      {showPasswordModal && (
        <Modal open={showPasswordModal} onClose={() => setShowPasswordModal(false)}>
          <ModalDialog>
            <ModalClose />
            <Typography level="h4" sx={{ mb: 2 }}>
              Смена пароля
            </Typography>

            <Stack spacing={2}>
              <FormControl>
                <FormLabel>Новый пароль</FormLabel>
                <Input
                  type="password"
                  value={password.new}
                  onChange={(e) => {
                    setPassword({ ...password, new: e.target.value });
                    setPasswordError(null);
                  }}
                  placeholder="Минимум 8 символов"
                />
              </FormControl>

              <FormControl>
                <FormLabel>Подтверждение пароля</FormLabel>
                <Input
                  type="password"
                  value={password.confirm}
                  onChange={(e) => {
                    setPassword({ ...password, confirm: e.target.value });
                    setPasswordError(null);
                  }}
                />
              </FormControl>

              {passwordError && (
                <Alert color="danger" variant="soft">
                  {passwordError}
                </Alert>
              )}

              <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end', mt: 2 }}>
                <Button variant="outlined" onClick={() => setShowPasswordModal(false)}>
                  Отмена
                </Button>
                <Button variant="solid" onClick={changePassword}>
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

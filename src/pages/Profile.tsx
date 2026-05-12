import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
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
  Edit as EditIcon,
  Person as PersonIcon,
  CalendarToday as CalendarIcon,
  Update as UpdateIcon,
} from '@mui/icons-material';
import Page from '../components/Page.tsx';
import { useAuth } from '../hooks/useAuth.ts';
import { getUser, updateUser, changeUserPasswordRest, type User } from '../api';

export default function ProfilePage() {
  const navigate = useNavigate();
  const { user: authUser } = useAuth();

  // State
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notification, setNotification] = useState<string | null>(null);
  const [notificationType, setNotificationType] = useState<'success' | 'danger'>('success');

  // Form data
  const [formData, setFormData] = useState({ fio: '' });
  const [isEditing, setIsEditing] = useState(false);

  // Password modal
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [password, setPassword] = useState({ old: '', new: '', confirm: '' });
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [changingPassword, setChangingPassword] = useState(false);

  // Load full user data (authUser может не содержать все поля)
  useEffect(() => {
    const loadUser = async () => {
      if (!authUser?.id) return;
      setLoading(true);
      try {
        const result = await getUser(authUser.id);
        if (result) {
          setUser(result);
          setFormData({ fio: result.fio || '' });
        } else {
          setError('Не удалось загрузить данные профиля');
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Ошибка загрузки');
      } finally {
        setLoading(false);
      }
    };
    loadUser();
  }, [authUser?.id]);

  const showNotification = (message: string, type: 'success' | 'danger' = 'success') => {
    setNotification(message);
    setNotificationType(type);
    setTimeout(() => setNotification(null), 4000);
  };

  const handleChange = (field: string) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [field]: e.target.value });
  };

  const save = async () => {
    if (!authUser?.id) return;
    setSaving(true);
    setError(null);
    try {
      await updateUser(authUser.id, { fio: formData.fio || undefined });
      showNotification('Данные сохранены', 'success');
      const result = await getUser(authUser.id);
      if (result) {
        setUser(result);
        setFormData({ fio: result.fio || '' });
      }
      setIsEditing(false);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Ошибка сохранения';
      setError(message);
      showNotification(message, 'danger');
    } finally {
      setSaving(false);
    }
  };

  const cancel = () => {
    if (user) setFormData({ fio: user.fio || '' });
    setIsEditing(false);
    showNotification('Изменения отменены', 'success');
  };

  const changePassword = async () => {
    if (password.new !== password.confirm) {
      setPasswordError('Пароли не совпадают');
      return;
    }
    if (password.new.length < 8) {
      setPasswordError('Пароль должен содержать минимум 8 символов');
      return;
    }
    if (!password.old) {
      setPasswordError('Введите текущий пароль');
      return;
    }
    setChangingPassword(true);
    try {
      await changeUserPasswordRest(password.old, password.new);
      setShowPasswordModal(false);
      setPassword({ old: '', new: '', confirm: '' });
      setPasswordError(null);
      showNotification('Пароль изменён', 'success');
    } catch (err) {
      setPasswordError(err instanceof Error ? err.message : 'Ошибка смены пароля');
    } finally {
      setChangingPassword(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ru-RU', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading) {
    return (
      <Page headerText="Мой профиль">
        <LinearProgress />
      </Page>
    );
  }

  if (!user) {
    return (
      <Page headerText="Мой профиль">
        <Alert color="danger" variant="soft" sx={{ mb: 2 }}>
          {error || 'Не удалось загрузить профиль'}
        </Alert>
        <Button onClick={() => navigate('/')} startDecorator={<BackIcon />}>
          На главную
        </Button>
      </Page>
    );
  }

  return (
    <Page headerText="Мой профиль">
      {notification && (
        <Alert color={notificationType} variant="soft" sx={{ mb: 2 }}>
          {notification}
        </Alert>
      )}
      {error && (
        <Alert color="danger" variant="soft" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}
      {saving && <LinearProgress />}

      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
        <Button variant="outlined" startDecorator={<BackIcon />} onClick={() => navigate('/')}>
          На главную
        </Button>
        <Typography level="h3">Мой профиль</Typography>
        <Chip
          variant="soft"
          color={user.isActive ? 'success' : 'danger'}
          startDecorator={user.isActive ? <ActiveIcon /> : undefined}
        >
          {user.isActive ? 'Активен' : 'Неактивен'}
        </Chip>
      </Box>

      <Stack spacing={3}>
        {/* Main Info */}
        <Card variant="outlined">
          <CardContent>
            <Box
              sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}
            >
              <Typography level="title-lg">Основная информация</Typography>
              {!isEditing && (
                <Button
                  variant="outlined"
                  size="sm"
                  startDecorator={<EditIcon />}
                  onClick={() => setIsEditing(true)}
                >
                  Редактировать
                </Button>
              )}
            </Box>
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
                {isEditing ? (
                  <Input
                    value={formData.fio}
                    onChange={handleChange('fio')}
                    placeholder="Не указано"
                    startDecorator={<PersonIcon />}
                  />
                ) : (
                  <Input value={user.fio || '—'} disabled />
                )}
              </FormControl>

              <Stack direction="row" spacing={4}>
                <FormControl>
                  <FormLabel>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <CalendarIcon fontSize="small" /> Дата регистрации
                    </Box>
                  </FormLabel>
                  <Input value={formatDate(user.registrationDate)} disabled />
                </FormControl>
                <FormControl>
                  <FormLabel>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <UpdateIcon fontSize="small" /> Последнее изменение
                    </Box>
                  </FormLabel>
                  <Input value={formatDate(user.updatedAt)} disabled />
                </FormControl>
              </Stack>
            </Stack>

            {isEditing && (
              <Box sx={{ mt: 3, pt: 3, borderTop: '1px solid', borderColor: 'divider' }}>
                <Stack direction="row" spacing={2} justifyContent="flex-end">
                  <Button
                    startDecorator={<CancelIcon />}
                    onClick={cancel}
                    variant="outlined"
                    color="neutral"
                    disabled={saving}
                  >
                    Отменить
                  </Button>
                  <Button
                    startDecorator={<SaveIcon />}
                    onClick={save}
                    variant="solid"
                    color="primary"
                    loading={saving}
                  >
                    Сохранить
                  </Button>
                </Stack>
              </Box>
            )}
          </CardContent>
        </Card>

        {/* Account Management */}
        <Card variant="outlined">
          <CardContent>
            <Typography level="title-lg" sx={{ mb: 2 }}>
              Управление аккаунтом
            </Typography>
            <Divider sx={{ mb: 3 }} />
            <Stack spacing={3}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Box>
                  <Typography level="title-md">Смена пароля</Typography>
                  <Typography level="body-sm" textColor="neutral.500">
                    Изменить пароль от аккаунта
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
            </Stack>
          </CardContent>
        </Card>
      </Stack>

      {/* Password Modal */}
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
              <FormControl>
                <FormLabel>Текущий пароль</FormLabel>
                <Input
                  type="password"
                  value={password.old}
                  onChange={(e) => {
                    setPassword({ ...password, old: e.target.value });
                    setPasswordError(null);
                  }}
                  placeholder="Введите текущий пароль"
                />
              </FormControl>
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
                  placeholder="Повторите пароль"
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

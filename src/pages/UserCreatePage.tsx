import { useState } from 'react';
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
  Switch,
  Divider,
  Alert,
  LinearProgress,
} from '@mui/joy';
import {
  ArrowBack as BackIcon,
  Save as SaveIcon,
  Cancel as CancelIcon,
  PersonAdd as AddUserIcon,
} from '@mui/icons-material';
import Page from '../components/Page.tsx';
import { useAuth } from '../hooks/useAuth.ts';
import { createUser } from '../api';

export default function CreateUserPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { loading: authLoading } = useAuth();

  // State
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notification, setNotification] = useState<string | null>(null);
  const [notificationType, setNotificationType] = useState<'success' | 'danger'>('success');

  // Form data
  const [formData, setFormData] = useState({
    login: '',
    password: '',
    confirmPassword: '',
    fio: '',
    isActive: true,
  });

  // Validation errors
  const [validationErrors, setValidationErrors] = useState<{
    login?: string;
    password?: string;
    confirmPassword?: string;
  }>({});

  // Show notification
  const showNotification = (message: string, type: 'success' | 'danger' = 'success') => {
    setNotification(message);
    setNotificationType(type);
    setTimeout(() => setNotification(null), 4000);
  };

  // Handle form change
  const handleChange = (field: string) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [field]: e.target.value });
    // Clear validation error when user starts typing
    if (validationErrors[field as keyof typeof validationErrors]) {
      setValidationErrors({ ...validationErrors, [field]: undefined });
    }
  };

  // Handle toggle active
  const toggleActive = () => {
    setFormData({ ...formData, isActive: !formData.isActive });
  };

  // Validate form
  const validateForm = (): boolean => {
    const errors: typeof validationErrors = {};

    if (!formData.login.trim()) {
      errors.login = 'Логин обязателен';
    } else if (formData.login.length < 3) {
      errors.login = 'Логин должен содержать минимум 3 символа';
    }

    if (!formData.password) {
      errors.password = 'Пароль обязателен';
    } else if (formData.password.length < 8) {
      errors.password = 'Пароль должен содержать минимум 8 символов';
    }

    if (formData.password !== formData.confirmPassword) {
      errors.confirmPassword = 'Пароли не совпадают';
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Handle create
  const create = async () => {
    if (!validateForm()) return;

    setLoading(true);
    setError(null);
    try {
      await createUser({
        login: formData.login.trim(),
        password: formData.password,
        fio: formData.fio.trim() || undefined,
        isActive: formData.isActive,
      });
      showNotification('Пользователь успешно создан', 'success');
      navigate('/users');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Ошибка создания пользователя';
      setError(message);
      showNotification(message, 'danger');
    } finally {
      setLoading(false);
    }
  };

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

  // Handle cancel
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

  return (
    <Page headerText="Создание пользователя">
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
        <Button variant="outlined" startDecorator={<BackIcon />} onClick={cancel}>
          Назад
        </Button>
        <Typography level="h3">Создание нового пользователя</Typography>
      </Box>

      <Stack spacing={3}>
        {/* Account Info Card */}
        <Card variant="outlined">
          <CardContent>
            <Typography level="title-lg" sx={{ mb: 2 }}>
              Учётные данные
            </Typography>
            <Divider sx={{ mb: 3 }} />

            <Stack spacing={2}>
              <FormControl error={!!validationErrors.login}>
                <FormLabel>Логин *</FormLabel>
                <Input
                  value={formData.login}
                  onChange={handleChange('login')}
                  placeholder="Придумайте логин"
                  disabled={loading}
                />
                {validationErrors.login && (
                  <Typography level="body-xs" color="danger">
                    {validationErrors.login}
                  </Typography>
                )}
              </FormControl>

              <FormControl error={!!validationErrors.password}>
                <FormLabel>Пароль *</FormLabel>
                <Input
                  type="password"
                  value={formData.password}
                  onChange={handleChange('password')}
                  placeholder="Минимум 8 символов"
                  disabled={loading}
                />
                {validationErrors.password && (
                  <Typography level="body-xs" color="danger">
                    {validationErrors.password}
                  </Typography>
                )}
              </FormControl>

              <FormControl error={!!validationErrors.confirmPassword}>
                <FormLabel>Подтверждение пароля *</FormLabel>
                <Input
                  type="password"
                  value={formData.confirmPassword}
                  onChange={handleChange('confirmPassword')}
                  placeholder="Повторите пароль"
                  disabled={loading}
                />
                {validationErrors.confirmPassword && (
                  <Typography level="body-xs" color="danger">
                    {validationErrors.confirmPassword}
                  </Typography>
                )}
              </FormControl>

              <FormControl>
                <FormLabel>ФИО</FormLabel>
                <Input
                  value={formData.fio}
                  onChange={handleChange('fio')}
                  placeholder="Иванов Иван Иванович"
                  disabled={loading}
                />
              </FormControl>
            </Stack>
          </CardContent>
        </Card>

        {/* Account Settings Card */}
        <Card variant="outlined">
          <CardContent>
            <Typography level="title-lg" sx={{ mb: 2 }}>
              Настройки аккаунта
            </Typography>
            <Divider sx={{ mb: 3 }} />

            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Box>
                <Typography level="title-md">Статус аккаунта</Typography>
                <Typography level="body-sm" textColor="neutral.500">
                  Активные пользователи могут входить в систему
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Switch checked={formData.isActive} onChange={toggleActive} disabled={loading} />
                <Button
                  variant={formData.isActive ? 'outlined' : 'solid'}
                  color={formData.isActive ? 'warning' : 'success'}
                  onClick={toggleActive}
                  disabled={loading}
                >
                  {formData.isActive ? 'Активен' : 'Неактивен'}
                </Button>
              </Box>
            </Box>
          </CardContent>
        </Card>

        {/* Info Alert */}
        <Alert color="primary" variant="soft" startDecorator={<AddUserIcon />}>
          <Typography level="body-sm">
            После создания пользователя вы сможете назначить ему роли на отдельной странице.
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

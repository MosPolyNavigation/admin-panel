import { useState } from 'react';
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
  Chip
} from '@mui/joy';
import {
  ArrowBack as BackIcon,
  Save as SaveIcon,
  Cancel as CancelIcon,
  LockReset as PasswordIcon,
  CheckCircle as ActiveIcon,
  Cancel as InactiveIcon
} from '@mui/icons-material';

export default function UserEditPage() {

  const [user, setUser] = useState({
    id: 1,
    name: 'Иван Петров',
    email: 'ivan@example.com',
    isActive: true,
    roles: ['Администратор', 'Модератор']
  });

  const [formData, setFormData] = useState({
    name: user.name,
    email: user.email
  });

  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showRolesModal, setShowRolesModal] = useState(false);
  
  const [password, setPassword] = useState({
    new: '',
    confirm: ''
  });

  const allRoles = ['Администратор', 'Модератор', 'Пользователь', 'Гость'];
  const [selectedRoles, setSelectedRoles] = useState<string[]>(user.roles);

  const [alert, setAlert] = useState('');

  const handleChange = (field: string) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [field]: e.target.value });
  };

  const toggleActive = () => {
    const newStatus = !user.isActive;
    setUser({ ...user, isActive: newStatus });
    showAlert(`Пользователь ${newStatus ? 'активирован' : 'деактивирован'}`);
  };

  const changePassword = () => {
    if (password.new !== password.confirm) {
      showAlert('Пароли не совпадают');
      return;
    }
    if (password.new.length < 6) {
      showAlert('Пароль слишком короткий');
      return;
    }
    setShowPasswordModal(false);
    setPassword({ new: '', confirm: '' });
    showAlert('Пароль изменен');
  };

  const toggleRole = (role: string) => {
    if (selectedRoles.includes(role)) {
      setSelectedRoles(selectedRoles.filter(r => r !== role));
    } else {
      setSelectedRoles([...selectedRoles, role]);
    }
  };

  const saveRoles = () => {
    setUser({ ...user, roles: selectedRoles });
    setShowRolesModal(false);
    showAlert('Роли обновлены');
  };

  const save = () => {
    setUser({ ...user, ...formData });
    showAlert('Данные сохранены');
  };

  const cancel = () => {
    setFormData({ name: user.name, email: user.email });
    setSelectedRoles(user.roles);
    showAlert('Изменения отменены');
  };

  const showAlert = (message: string) => {
    setAlert(message);
    setTimeout(() => setAlert(''), 3000);
  };

  return (
    <Box sx={{ p: 3 }}>

      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
        <Button
          variant="outlined"
          startDecorator={<BackIcon />}
          onClick={() => window.history.back()}
        >
          Назад
        </Button>
        <Typography level="h2">Редактирование пользователя</Typography>
        <Chip
          variant="soft"
          color={user.isActive ? 'success' : 'danger'}
          startDecorator={user.isActive ? <ActiveIcon /> : <InactiveIcon />}
        >
          {user.isActive ? 'Активен' : 'Неактивен'}
        </Chip>
      </Box>

      {alert && (
        <Alert color="success" variant="soft" sx={{ mb: 3 }}>
          {alert}
        </Alert>
      )}

      <Stack spacing={3}>
        <Card variant="outlined">
          <CardContent>
            <Typography level="title-lg" sx={{ mb: 2 }}>
              Основная информация
            </Typography>
            <Divider sx={{ mb: 3 }} />
            
            <Stack spacing={2}>
              <FormControl>
                <FormLabel>Имя пользователя</FormLabel>
                <Input
                  value={formData.name}
                  onChange={handleChange('name')}
                />
              </FormControl>
              
              <FormControl>
                <FormLabel>Email</FormLabel>
                <Input
                  type="email"
                  value={formData.email}
                  onChange={handleChange('email')}
                />
              </FormControl>
            </Stack>
          </CardContent>
        </Card>

        <Card variant="outlined">
          <CardContent>
            <Typography level="title-lg" sx={{ mb: 2 }}>
              Управление аккаунтом
            </Typography>
            <Divider sx={{ mb: 3 }} />
            
            <Stack spacing={2}>
              {/* Активация */}
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography>Статус аккаунта</Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Switch
                    checked={user.isActive}
                    onChange={toggleActive}
                  />
                  <Button
                    variant={user.isActive ? "outlined" : "solid"}
                    color={user.isActive ? "warning" : "success"}
                    onClick={toggleActive}
                  >
                    {user.isActive ? 'Деактивировать' : 'Активировать'}
                  </Button>
                </Box>
              </Box>

              {/* Пароль */}
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

              {/* Роли */}
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Box>
                  <Typography>Роли пользователя</Typography>
                  <Stack direction="row" spacing={1} sx={{ mt: 1 }}>
                    {user.roles.map((role, i) => (
                      <Chip key={i} size="sm">{role}</Chip>
                    ))}
                  </Stack>
                </Box>
                <Button
                  variant="outlined"
                  onClick={() => setShowRolesModal(true)}
                >
                  Назначить роли
                </Button>
              </Box>
            </Stack>
          </CardContent>
        </Card>
      </Stack>

      <Box sx={{ mt: 4, pt: 3, borderTop: '1px solid', borderColor: 'divider' }}>
        <Stack direction="row" spacing={2} justifyContent="flex-end">
          <Button
            startDecorator={<CancelIcon />}
            onClick={cancel}
            variant="outlined"
            color="neutral"
            size="lg"
          >
            Отменить
          </Button>
          <Button
            startDecorator={<SaveIcon />}
            onClick={save}
            variant="solid"
            color="primary"
            size="lg"
          >
            Сохранить
          </Button>
        </Stack>
      </Box>

      {showPasswordModal && (
        <Box sx={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          bgcolor: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <Card sx={{ width: 400 }}>
            <CardContent>
              <Typography level="h4" sx={{ mb: 2 }}>Смена пароля</Typography>
              
              <Stack spacing={2}>
                <FormControl>
                  <FormLabel>Новый пароль</FormLabel>
                  <Input
                    type="password"
                    value={password.new}
                    onChange={(e) => setPassword({ ...password, new: e.target.value })}
                  />
                </FormControl>
                
                <FormControl>
                  <FormLabel>Подтверждение</FormLabel>
                  <Input
                    type="password"
                    value={password.confirm}
                    onChange={(e) => setPassword({ ...password, confirm: e.target.value })}
                  />
                </FormControl>
                
                <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
                  <Button
                    variant="outlined"
                    onClick={() => setShowPasswordModal(false)}
                  >
                    Отмена
                  </Button>
                  <Button
                    variant="solid"
                    onClick={changePassword}
                  >
                    Изменить
                  </Button>
                </Box>
              </Stack>
            </CardContent>
          </Card>
        </Box>
      )}

      {showRolesModal && (
        <Box sx={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          bgcolor: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <Card sx={{ width: 400 }}>
            <CardContent>
              <Typography level="h4" sx={{ mb: 2 }}>Назначение ролей</Typography>
              
              <Stack spacing={1} sx={{ mb: 3 }}>
                {allRoles.map((role) => (
                  <Box
                    key={role}
                    onClick={() => toggleRole(role)}
                    sx={{
                      p: 1.5,
                      borderRadius: 'sm',
                      border: '1px solid',
                      borderColor: selectedRoles.includes(role) ? 'primary.500' : 'neutral.outlinedBorder',
                      bgcolor: selectedRoles.includes(role) ? 'primary.softBg' : 'transparent',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 2
                    }}
                  >
                    <Box sx={{
                      width: 20,
                      height: 20,
                      borderRadius: 'sm',
                      border: '2px solid',
                      borderColor: selectedRoles.includes(role) ? 'primary.500' : 'neutral.400',
                      bgcolor: selectedRoles.includes(role) ? 'primary.500' : 'transparent',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '12px',
                      color: 'white'
                    }}>
                      {selectedRoles.includes(role) && '✓'}
                    </Box>
                    <Typography>{role}</Typography>
                  </Box>
                ))}
              </Stack>
              
              <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
                <Button
                  variant="outlined"
                  onClick={() => setShowRolesModal(false)}
                >
                  Отмена
                </Button>
                <Button
                  variant="solid"
                  onClick={saveRoles}
                >
                  Сохранить
                </Button>
              </Box>
            </CardContent>
          </Card>
        </Box>
      )}
    </Box>
  );
}
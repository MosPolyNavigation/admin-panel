import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router';
import {
  Typography,
  Box,
  Card,
  CardContent,
  Stack,
  Input,
  FormControl,
  FormLabel,
  Divider,
  Alert,
  Button,
  Chip,
  Sheet,
  Checkbox,
  Badge,
  IconButton
} from '@mui/joy';
import {
  ArrowBack as BackIcon,
  Save as SaveIcon,
  Person as PersonIcon,
  Security as SecurityIcon,
  Group as GroupIcon,
  Info as InfoIcon
} from '@mui/icons-material';

interface Role {
  id: string;
  name: string;
  description: string;
  permissions: string[];
}

interface User {
  id: string;
  username: string;
  fullName: string;
  email: string;
  currentRoles: Role[];
}

interface AvailableRole extends Role {
  selected: boolean;
}

function RolesPage() {
  const { userId } = useParams<{ userId: string }>();
  const navigate = useNavigate();
  
  const [user, setUser] = useState<User>({
    id: userId || '1',
    username: 'ivan_petrov',
    fullName: 'Иван Петров',
    email: 'ivan@example.com',
    currentRoles: [
      {
        id: '1',
        name: 'Администратор',
        description: 'Полный доступ ко всем функциям',
        permissions: ['all']
      },
      {
        id: '2',
        name: 'Модератор',
        description: 'Управление контентом',
        permissions: ['content_manage', 'users_view']
      }
    ]
  });

  const [availableRoles, setAvailableRoles] = useState<AvailableRole[]>([
    {
      id: '1',
      name: 'Администратор',
      description: 'Полный доступ ко всем функциям системы',
      permissions: ['users_manage', 'roles_manage', 'content_manage', 'settings_manage'],
      selected: true
    },
    {
      id: '2',
      name: 'Редактор',
      description: 'Создание и редактирование контента',
      permissions: ['content_create', 'content_edit', 'content_publish'],
      selected: false
    },
    {
      id: '3',
      name: 'Модератор',
      description: 'Модерация и проверка контента',
      permissions: ['content_moderate', 'users_view', 'reports_view'],
      selected: true
    },
    {
      id: '4',
      name: 'Наблюдатель',
      description: 'Только просмотр контента и аналитики',
      permissions: ['content_view', 'reports_view', 'analytics_view'],
      selected: false
    },
    {
      id: '5',
      name: 'Аналитик',
      description: 'Доступ к аналитике и отчетам',
      permissions: ['analytics_view', 'reports_generate', 'data_export'],
      selected: false
    },
    {
      id: '6',
      name: 'Гость',
      description: 'Ограниченный доступ',
      permissions: ['content_view'],
      selected: false
    }
  ]);

  const [searchTerm, setSearchTerm] = useState('');
  const [notification, setNotification] = useState<{ 
    type: 'success' | 'danger' | 'warning' | 'neutral' | 'primary', 
    message: string 
  } | null>(null);

  useEffect(() => {
    setAvailableRoles(prev => prev.map(role => ({
      ...role,
      selected: user.currentRoles.some(userRole => userRole.id === role.id)
    })));
  }, [user.currentRoles]);

  // Фильтрация ролей по поиску
  const filteredRoles = availableRoles.filter(role =>
    role.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    role.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Переключение роли
  const handleRoleToggle = (roleId: string) => {
    setAvailableRoles(prev => prev.map(role =>
      role.id === roleId ? { ...role, selected: !role.selected } : role
    ));
  };

  const handleSelectAll = () => {
    setAvailableRoles(prev => prev.map(role => ({ ...role, selected: true })));
  };

  const handleDeselectAll = () => {
    setAvailableRoles(prev => prev.map(role => ({ ...role, selected: false })));
  };

  // Сохранение изменений
  const handleSave = () => {
    const selectedRoles = availableRoles
      .filter(role => role.selected)
      .map(({ selected, ...role }) => role);

    setUser(prev => ({ ...prev, currentRoles: selectedRoles }));
    
    setNotification({ 
      type: 'success', 
      message: `Роли для пользователя ${user.fullName} успешно обновлены!` 
    });
    
    setTimeout(() => setNotification(null), 3000);
  };

  // Отмена изменений
  const handleCancel = () => {
    navigate(`/users/${userId}/edit`);
  };

  const handleBack = () => {
    navigate(`/users/${userId}/edit`);
  };

  // Подсчет выбранных ролей
  const selectedCount = availableRoles.filter(role => role.selected).length;

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
        <IconButton
          variant="outlined"
          onClick={handleBack}
          sx={{ alignSelf: 'flex-start' }}
        >
          <BackIcon />
        </IconButton>
        <Typography level="h2">Управление ролями пользователя</Typography>
      </Box>

      {notification && (
        <Alert 
          color={notification.type}
          variant="soft" 
          sx={{ mb: 3 }}
          startDecorator={<InfoIcon />}
        >
          {notification.message}
        </Alert>
      )}

      <Stack spacing={3}>
        <Card variant="outlined">
          <CardContent>
            <Typography level="title-lg" startDecorator={<PersonIcon />} sx={{ mb: 2 }}>
              Информация о пользователе
            </Typography>
            <Divider sx={{ mb: 2 }} />
            <Stack spacing={2}>
              <Box sx={{ display: 'flex', gap: 3 }}>
                <Box>
                  <Typography level="body-xs">Имя:</Typography>
                  <Typography level="title-sm">{user.fullName}</Typography>
                </Box>
                <Box>
                  <Typography level="body-xs">Логин:</Typography>
                  <Typography level="title-sm">{user.username}</Typography>
                </Box>
                <Box>
                  <Typography level="body-xs">Email:</Typography>
                  <Typography level="title-sm">{user.email}</Typography>
                </Box>
              </Box>
              
              <Box>
                <Typography level="body-xs" sx={{ mb: 1 }}>
                  Текущие роли ({user.currentRoles.length}):
                </Typography>
                <Stack direction="row" spacing={1} flexWrap="wrap">
                  {user.currentRoles.map(role => (
                    <Chip
                      key={role.id}
                      variant="soft"
                      color="primary"
                      size="sm"
                      startDecorator={<SecurityIcon />}
                    >
                      {role.name}
                    </Chip>
                  ))}
                </Stack>
              </Box>
            </Stack>
          </CardContent>
        </Card>

        <Card variant="outlined">
          <CardContent>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography level="title-lg" startDecorator={<GroupIcon />}>
                Назначение ролей
              </Typography>
              <Badge badgeContent={selectedCount} color="primary" size="lg">
                <Typography level="body-sm">
                  Выбрано: {selectedCount} из {availableRoles.length}
                </Typography>
              </Badge>
            </Box>
            <Divider sx={{ mb: 3 }} />

            <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
              <FormControl sx={{ flex: 1 }}>
                <FormLabel>Поиск ролей</FormLabel>
                <Input
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Поиск по названию или описанию..."
                  endDecorator={
                    searchTerm && (
                      <IconButton size="sm" onClick={() => setSearchTerm('')}>
                        ✕
                      </IconButton>
                    )
                  }
                />
              </FormControl>
              
              <Stack direction="row" spacing={1}>
                <Button
                  variant="outlined"
                  size="sm"
                  onClick={handleSelectAll}
                >
                  Выбрать все
                </Button>
                <Button
                  variant="outlined"
                  size="sm"
                  onClick={handleDeselectAll}
                >
                  Снять все
                </Button>
              </Stack>
            </Box>

            <Sheet variant="outlined" sx={{ borderRadius: 'sm', overflow: 'hidden' }}>
              <Box
                sx={{
                  display: 'grid',
                  gridTemplateColumns: '60px 1fr 1.5fr 2fr',
                  p: 2,
                  borderBottom: '1px solid',
                  borderColor: 'divider',
                  bgcolor: 'background.level1'
                }}
              >
                <Typography level="body-sm" fontWeight="lg">Выбор</Typography>
                <Typography level="body-sm" fontWeight="lg">Роль</Typography>
                <Typography level="body-sm" fontWeight="lg">Описание</Typography>
                <Typography level="body-sm" fontWeight="lg">Разрешения</Typography>
              </Box>

              {filteredRoles.map((role) => (
                <Box
                  key={role.id}
                  sx={{
                    display: 'grid',
                    gridTemplateColumns: '60px 1fr 1.5fr 2fr',
                    p: 2,
                    borderBottom: '1px solid',
                    borderColor: 'divider',
                    '&:hover': {
                      bgcolor: 'background.level1'
                    },
                    '&:last-child': {
                      borderBottom: 'none'
                    }
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <Checkbox
                      checked={role.selected}
                      onChange={() => handleRoleToggle(role.id)}
                      color="primary"
                    />
                  </Box>

                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <Typography level="title-sm">{role.name}</Typography>
                  </Box>

                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <Typography level="body-sm">{role.description}</Typography>
                  </Box>

                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <Stack direction="row" spacing={0.5} flexWrap="wrap">
                      {role.permissions.slice(0, 3).map((perm, index) => (
                        <Chip
                          key={index}
                          size="sm"
                          variant="soft"
                          color="neutral"
                        >
                          {perm}
                        </Chip>
                      ))}
                      {role.permissions.length > 3 && (
                        <Chip size="sm" variant="plain">
                          +{role.permissions.length - 3}
                        </Chip>
                      )}
                    </Stack>
                  </Box>
                </Box>
              ))}
            </Sheet>

            {filteredRoles.length === 0 && (
              <Box sx={{ textAlign: 'center', py: 4 }}>
                <Typography level="body-lg" color="neutral">
                  Роли не найдены
                </Typography>
              </Box>
            )}
          </CardContent>
        </Card>

        <Card variant="outlined">
          <CardContent>
            <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
              <Button
                variant="outlined"
                color="neutral"
                onClick={handleCancel}
                sx={{ minWidth: 120 }}
              >
                Отмена
              </Button>
              <Button
                variant="solid"
                color="primary"
                startDecorator={<SaveIcon />}
                onClick={handleSave}
                sx={{ minWidth: 120 }}
              >
                Сохранить роли
              </Button>
            </Box>
          </CardContent>
        </Card>
      </Stack>
    </Box>
  );
}

export default RolesPage;
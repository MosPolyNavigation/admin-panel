import { useState } from 'react';
import { useNavigate, useParams } from 'react-router';
import {
  Typography,
  Sheet,
  Button,
  Chip,
  Stack,
  Modal,
  ModalClose,
  ModalDialog,
  Divider,
  Alert,
  Input,
  FormControl,
  FormLabel,
  Box,
  Card,
  CardContent,
  IconButton,
  Switch,
  Textarea,
  Badge,
  Tooltip,
  Table,
} from '@mui/joy';
import Page from "../components/Page.tsx";
import {
  ArrowBack as ArrowBackIcon,
  Delete as DeleteIcon,
  Add as AddIcon,
  Save as SaveIcon,
  Cancel as CancelIcon,
  Lock as LockIcon,
  Person as PersonIcon,
  Info as InfoIcon,
  CheckCircle as CheckCircleIcon,
  DoNotDisturb as DoNotDisturbIcon,
  ExpandMore as ExpandMoreIcon
} from '@mui/icons-material';

// Типы данных
interface Permission {
  id: number;
  name: string;
  description: string;
  checked: boolean;
}

interface Entity {
  id: number;
  name: string;
  permissions: Permission[];
}

interface Role {
  id: number;
  name: string;
  description: string;
  entities: Entity[];
  userCount: number;
  isDefault?: boolean;
}

const mockRoles: Role[] = [
  {
    id: 1,
    name: 'Администратор',
    description: 'Полный доступ ко всем функциям системы',
    entities: [
      {
        id: 1,
        name: 'Пользователи',
        permissions: [
          { id: 1, name: 'Просмотр', description: 'Просмотр списка пользователей', checked: true },
          { id: 2, name: 'Создание', description: 'Создание новых пользователей', checked: true },
          { id: 3, name: 'Редактирование', description: 'Изменение данных пользователей', checked: true },
          { id: 4, name: 'Удаление', description: 'Удаление пользователей', checked: true },
          { id: 5, name: 'Блокировка', description: 'Блокировка пользователей', checked: true },
        ],
      },
      {
        id: 2,
        name: 'Гость',
        permissions: [
          { id: 6, name: 'Просмотр', description: 'Просмотр id', checked: true },
          { id: 7, name: 'Отслеживание на сайте', description: 'Просмотр активности', checked: true },
        ],
      },
    ],
    userCount: 5,
  },
  {
    id: 2,
    name: 'Редактор',
    description: 'Доступ к созданию и редактированию контента',
    entities: [
      {
        id: 2,
        name: 'Статьи',
        permissions: [
          { id: 6, name: 'Просмотр', description: 'Просмотр статей', checked: true },
          { id: 7, name: 'Создание', description: 'Создание новых статей', checked: true },
          { id: 8, name: 'Редактирование', description: 'Редактирование статей', checked: true },
          { id: 10, name: 'Публикация', description: 'Публикация статей', checked: false },
        ],
      },
    ],
    userCount: 12,
    isDefault: true,
  },
  {
    id: 3,
    name: 'Просмотр',
    description: 'Только просмотр данных',
    entities: [
      {
        id: 1,
        name: 'Пользователи',
        permissions: [
          { id: 1, name: 'Просмотр', description: 'Просмотр списка пользователей', checked: true },
        ],
      },
      {
        id: 2,
        name: 'Статьи',
        permissions: [
          { id: 6, name: 'Просмотр', description: 'Просмотр статей', checked: true },
        ],
      },
    ],
    userCount: 23,
  },
];

const defaultPermissions = [
  { id: 1, name: 'Просмотр', description: 'Просмотр записей', checked: false },
  { id: 2, name: 'Создание', description: 'Создание новых записей', checked: false },
  { id: 3, name: 'Редактирование', description: 'Редактирование записей', checked: false },
  { id: 4, name: 'Удаление', description: 'Удаление записей', checked: false },
];

const RoleEditPage = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const roleId = parseInt(id || '1');
  
  const [originalRole, setOriginalRole] = useState<Role>(mockRoles.find(r => r.id === roleId) || mockRoles[0]);
  const [role, setRole] = useState<Role>(originalRole);
  const [_isEditing, setIsEditing] = useState(true); 
  const [notification, setNotification] = useState('');
  const [showAddEntity, setShowAddEntity] = useState(false);
  const [newEntityName, setNewEntityName] = useState('');
  const [expandedEntities, setExpandedEntities] = useState<number[]>(role.entities.map(e => e.id));
  const [deleteEntityModal, setDeleteEntityModal] = useState<{
    open: boolean;
    entityId: number | null;
    entityName: string;
  }>({ open: false, entityId: null, entityName: '' });

  const handleBack = () => {
    navigate(-1);
  };

  // Сохранение изменений
  const handleSave = () => {
    setOriginalRole(role);
    setIsEditing(false);
    setNotification('Изменения роли сохранены');
    setTimeout(() => setNotification(''), 3000);
  };

  // Отмена изменений
  const handleCancel = () => {
    setRole(originalRole);
    setIsEditing(false);
    setNotification('Изменения отменены');
    setTimeout(() => setNotification(''), 3000);
  };

  // Изменение роли
  const handleRoleNameChange = (value: string) => {
    setRole(prev => ({ ...prev, name: value }));
  };

  // Изменение описания роли
  const handleRoleDescriptionChange = (value: string) => {
    setRole(prev => ({ ...prev, description: value }));
  };

  // Переключение права доступа
  const togglePermission = (entityId: number, permissionId: number) => {
    setRole(prev => ({
      ...prev,
      entities: prev.entities.map(entity => 
        entity.id === entityId 
          ? {
              ...entity,
              permissions: entity.permissions.map(permission =>
                permission.id === permissionId
                  ? { ...permission, checked: !permission.checked }
                  : permission
              )
            }
          : entity
      )
    }));
  };

  // Добавление новой сущности
  const handleAddEntity = () => {
    if (!newEntityName.trim()) {
      setNotification('Введите название сущности');
      setTimeout(() => setNotification(''), 3000);
      return;
    }

    const newEntity: Entity = {
      id: Date.now(),
      name: newEntityName,
      permissions: defaultPermissions.map(perm => ({ ...perm })),
    };

    setRole(prev => ({
      ...prev,
      entities: [...prev.entities, newEntity],
    }));

    setExpandedEntities(prev => [...prev, newEntity.id]);
    setNewEntityName('');
    setShowAddEntity(false);
    setNotification(`Сущность "${newEntityName}" добавлена`);
    setTimeout(() => setNotification(''), 3000);
  };

  // Удаление сущности
  const handleDeleteEntity = (entityId: number) => {
    setRole(prev => ({
      ...prev,
      entities: prev.entities.filter(entity => entity.id !== entityId),
    }));
    setExpandedEntities(prev => prev.filter(id => id !== entityId));
    setDeleteEntityModal({ open: false, entityId: null, entityName: '' });
    setNotification('Сущность удалена');
    setTimeout(() => setNotification(''), 3000);
  };

  // Переключение видимости сущности
  const toggleEntityExpand = (entityId: number) => {
    setExpandedEntities(prev =>
      prev.includes(entityId)
        ? prev.filter(id => id !== entityId)
        : [...prev, entityId]
    );
  };

  // Переключение всех прав в сущности
  const toggleAllPermissions = (entityId: number) => {
    setRole(prev => ({
      ...prev,
      entities: prev.entities.map(entity => {
        if (entity.id === entityId) {
          const allChecked = entity.permissions.every(p => p.checked);
          return {
            ...entity,
            permissions: entity.permissions.map(p => ({
              ...p,
              checked: !allChecked
            }))
          };
        }
        return entity;
      })
    }));
  };

  return (
    <Page headerText={`Редактирование роли: ${role.name}`}>
      {notification && (
        <Alert color="success" variant="soft" sx={{ mb: 2 }}>
          {notification}
        </Alert>
      )}

      <Stack direction="row" justifyContent="space-between" alignItems="flex-start" sx={{ mb: 4 }}>
        <Stack spacing={2}>
          <Button
            startDecorator={<ArrowBackIcon />}
            onClick={handleBack}
            variant="outlined"
            sx={{ alignSelf: 'flex-start' }}
          >
            Назад
          </Button>
          
          <Stack direction="row" spacing={2} alignItems="center">
            <Typography level="h2" component="h1">
              {role.name}
            </Typography>
            {role.isDefault && (
              <Chip
                startDecorator={<LockIcon />}
                variant="soft"
                color="neutral"
                size="sm"
              >
                Системная роль
              </Chip>
            )}
            <Badge badgeContent={role.userCount} color="primary">
              <PersonIcon />
            </Badge>
          </Stack>
        </Stack>
      </Stack>

      <Card variant="outlined" sx={{ mb: 3 }}>
        <CardContent>
          <Typography level="h4" gutterBottom>
            <Stack direction="row" alignItems="center" spacing={1}>
              <InfoIcon color="primary" />
              <span>Основная информация</span>
            </Stack>
          </Typography>
          <Divider sx={{ my: 2 }} />
          
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 3 }}>
            <FormControl>
              <FormLabel>Название роли</FormLabel>
              <Input
                value={role.name}
                onChange={(e) => handleRoleNameChange(e.target.value)}
                disabled={role.isDefault}
                placeholder="Введите название роли"
                size="lg"
              />
            </FormControl>
            
            <FormControl>
              <FormLabel>Количество пользователей</FormLabel>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <PersonIcon color="primary" />
                <Typography level="h4">{role.userCount}</Typography>
                <Chip 
                  variant="outlined" 
                  color="primary"
                  size="sm"
                >
                  Пользователей
                </Chip>
              </Box>
            </FormControl>
            
            <FormControl sx={{ gridColumn: { xs: 'span 1', md: 'span 2' } }}>
              <FormLabel>Описание роли</FormLabel>
              <Textarea
                value={role.description}
                onChange={(e) => handleRoleDescriptionChange(e.target.value)}
                disabled={role.isDefault}
                placeholder="Опишите назначение роли"
                minRows={2}
                size="lg"
              />
            </FormControl>
            
            <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', gridColumn: { xs: 'span 1', md: 'span 2' } }}>
              <Chip variant="outlined" size="lg">
                ID: {role.id}
              </Chip>
              {role.isDefault && (
                <Chip 
                  startDecorator={<LockIcon />}
                  variant="soft"
                  color="warning"
                  size="lg"
                >
                  Системная роль
                </Chip>
              )}
            </Box>
            
            {role.isDefault && (
              <Alert 
                color="warning" 
                variant="soft" 
                startDecorator={<LockIcon />}
                sx={{ gridColumn: { xs: 'span 1', md: 'span 2' } }}
              >
                Системная роль не может быть отредактирована или удалена
              </Alert>
            )}
          </Box>
        </CardContent>
      </Card>

      <Card variant="outlined" sx={{ mb: 3 }}>
        <CardContent>
          <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 3 }}>
            <Typography level="h4">
              Сущности и права доступа
            </Typography>
            
            {!role.isDefault && (
              <Button
                startDecorator={<AddIcon />}
                onClick={() => setShowAddEntity(true)}
                variant="outlined"
              >
                Добавить сущность
              </Button>
            )}
          </Stack>
          
          <Divider sx={{ mb: 3 }} />
          
          {role.entities.length === 0 ? (
            <Sheet
              variant="outlined"
              sx={{
                p: 4,
                textAlign: 'center',
                borderRadius: 'sm'
              }}
            >
              <Typography color="neutral" level="body-md" gutterBottom>
                Нет добавленных сущностей
              </Typography>
              {!role.isDefault && (
                <Button
                  startDecorator={<AddIcon />}
                  onClick={() => setShowAddEntity(true)}
                  variant="outlined"
                  sx={{ mt: 2 }}
                >
                  Добавить первую сущность
                </Button>
              )}
            </Sheet>
          ) : (
            <Stack spacing={2}>
              {role.entities.map((entity) => (
                <Sheet key={entity.id} variant="outlined" sx={{ borderRadius: 'sm' }}>
                  <Box sx={{ p: 2 }}>
                    <Stack 
                      direction="row" 
                      justifyContent="space-between" 
                      alignItems="center" 
                      sx={{ mb: 2 }}
                    >
                      <Stack direction="row" alignItems="center" spacing={2}>
                        <IconButton
                          variant="plain"
                          onClick={() => toggleEntityExpand(entity.id)}
                          size="sm"
                        >
                          <ExpandMoreIcon
                            sx={{
                              transform: expandedEntities.includes(entity.id) 
                                ? 'rotate(180deg)' 
                                : 'rotate(0deg)',
                              transition: 'transform 0.2s'
                            }}
                          />
                        </IconButton>
                        <Typography level="title-lg">
                          {entity.name}
                        </Typography>
                      </Stack>
                      
                      <Stack direction="row" spacing={1} alignItems="center">
                        <Typography level="body-sm" color="neutral">
                          {entity.permissions.filter(p => p.checked).length} / {entity.permissions.length} прав
                        </Typography>
                        {!role.isDefault && (
                          <Tooltip title="Удалить сущность">
                            <IconButton
                              onClick={() => setDeleteEntityModal({
                                open: true,
                                entityId: entity.id,
                                entityName: entity.name,
                              })}
                              color="danger"
                              size="sm"
                              variant="plain"
                            >
                              <DeleteIcon />
                            </IconButton>
                          </Tooltip>
                        )}
                      </Stack>
                    </Stack>
                    
                    {expandedEntities.includes(entity.id) && (
                      <>
                        <Divider sx={{ mb: 2 }} />
                        
                        {!role.isDefault && (
                          <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
                            <Typography level="body-sm">
                              Права доступа
                            </Typography>
                            <Button
                              size="sm"
                              variant="plain"
                              onClick={() => toggleAllPermissions(entity.id)}
                            >
                              {entity.permissions.every(p => p.checked) ? 'Снять все' : 'Выбрать все'}
                            </Button>
                          </Stack>
                        )}
                        
                        <Table sx={{ '& tr:last-child td': { borderBottom: 0 } }}>
                          <thead>
                            <tr>
                              <th style={{ width: '40%' }}>Право</th>
                              <th>Описание</th>
                              <th style={{ width: '150px', textAlign: 'center' }}>Статус</th>
                            </tr>
                          </thead>
                          <tbody>
                            {entity.permissions.map((permission) => (
                              <tr key={permission.id}>
                                <td>
                                  <Typography level="body-md">
                                    {permission.name}
                                  </Typography>
                                </td>
                                <td>
                                  <Typography level="body-sm" color="neutral">
                                    {permission.description}
                                  </Typography>
                                </td>
                                <td style={{ textAlign: 'center' }}>
                                  {!role.isDefault ? (
                                    <Switch
                                      checked={permission.checked}
                                      onChange={() => togglePermission(entity.id, permission.id)}
                                      size="md"
                                    />
                                  ) : (
                                    <Chip
                                      variant="soft"
                                      color={permission.checked ? 'success' : 'neutral'}
                                      size="sm"
                                      startDecorator={
                                        permission.checked 
                                          ? <CheckCircleIcon fontSize="small" /> 
                                          : <DoNotDisturbIcon fontSize="small" />
                                      }
                                    >
                                      {permission.checked ? 'Разрешено' : 'Запрещено'}
                                    </Chip>
                                  )}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </Table>
                      </>
                    )}
                  </Box>
                </Sheet>
              ))}
            </Stack>
          )}
        </CardContent>
      </Card>

      <Card variant="outlined">
        <CardContent>
          <Typography level="h4" gutterBottom>
            Сводка прав
          </Typography>
          <Divider sx={{ mb: 2 }} />
          
          <Table sx={{ '& tr:last-child td': { borderBottom: 0 } }}>
            <thead>
              <tr>
                <th>Сущность</th>
                <th>Всего прав</th>
                <th>Разрешено</th>
                <th>Запрещено</th>
                <th>Процент доступа</th>
              </tr>
            </thead>
            <tbody>
              {role.entities.map((entity) => {
                const total = entity.permissions.length;
                const allowed = entity.permissions.filter(p => p.checked).length;
                const denied = total - allowed;
                const percentage = total > 0 ? Math.round((allowed / total) * 100) : 0;
                
                return (
                  <tr key={entity.id}>
                    <td>
                      <Typography level="body-md">
                        {entity.name}
                      </Typography>
                    </td>
                    <td>
                      <Typography level="body-md">
                        {total}
                      </Typography>
                    </td>
                    <td>
                      <Chip variant="soft" color="success" size="sm">
                        {allowed}
                      </Chip>
                    </td>
                    <td>
                      <Chip variant="soft" color="neutral" size="sm">
                        {denied}
                      </Chip>
                    </td>
                    <td>
                      <Stack direction="row" spacing={1} alignItems="center">
                        <Box sx={{ flex: 1, bgcolor: 'neutral.softBg', height: 8, borderRadius: 4, overflow: 'hidden' }}>
                          <Box 
                            sx={{ 
                              width: `${percentage}%`, 
                              height: '100%', 
                              bgcolor: percentage === 100 ? 'success.400' : 
                                      percentage > 50 ? 'primary.400' : 
                                      'warning.400',
                              borderRadius: 4
                            }} 
                          />
                        </Box>
                        <Typography level="body-sm">
                          {percentage}%
                        </Typography>
                      </Stack>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </Table>
        </CardContent>
      </Card>

      <Box sx={{ mt: 4, pt: 3, borderTop: '1px solid', borderColor: 'divider' }}>
        <Stack direction="row" spacing={2} justifyContent="flex-end">
          <Button
            startDecorator={<CancelIcon />}
            onClick={handleCancel}
            variant="outlined"
            color="neutral"
            size="lg"
          >
            Отменить
          </Button>
          <Button
            startDecorator={<SaveIcon />}
            onClick={handleSave}
            variant="solid"
            color="primary"
            size="lg"
          >
            Сохранить
          </Button>
        </Stack>
      </Box>

      <Modal open={showAddEntity} onClose={() => setShowAddEntity(false)}>
        <ModalDialog size="lg">
          <ModalClose />
          <Typography level="h4">Добавить новую сущность</Typography>
          <Divider sx={{ my: 2 }} />
          
          <FormControl sx={{ mb: 3 }}>
            <FormLabel>Название сущности</FormLabel>
            <Input
              value={newEntityName}
              onChange={(e) => setNewEntityName(e.target.value)}
              placeholder="Например: Категории, Заказы, Отчеты"
              autoFocus
            />
          </FormControl>
          
          <Typography level="title-sm" gutterBottom>
            Права доступа
          </Typography>
          
          <Table sx={{ mb: 3 }}>
            <thead>
              <tr>
                <th>Право</th>
                <th>Описание</th>
                <th style={{ width: '100px', textAlign: 'center' }}>Включить</th>
              </tr>
            </thead>
            <tbody>
              {defaultPermissions.map((permission) => (
                <tr key={permission.id}>
                  <td>
                    <Typography level="body-md">
                      {permission.name}
                    </Typography>
                  </td>
                  <td>
                    <Typography level="body-sm" color="neutral">
                      {permission.description}
                    </Typography>
                  </td>
                  <td style={{ textAlign: 'center' }}>
                    <Switch
                      checked={permission.checked}
                      onChange={() => {
                        const index = defaultPermissions.findIndex(p => p.id === permission.id);
                        if (index !== -1) {
                          defaultPermissions[index].checked = !defaultPermissions[index].checked;
                        }
                      }}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
          
          <Stack direction="row" spacing={1} justifyContent="flex-end">
            <Button variant="outlined" onClick={() => setShowAddEntity(false)}>
              Отмена
            </Button>
            <Button 
              variant="solid" 
              onClick={handleAddEntity}
              disabled={!newEntityName.trim()}
            >
              Добавить
            </Button>
          </Stack>
        </ModalDialog>
      </Modal>

      <Modal open={deleteEntityModal.open} onClose={() => setDeleteEntityModal({ open: false, entityId: null, entityName: '' })}>
        <ModalDialog>
          <ModalClose />
          <Typography level="h4">Удалить сущность?</Typography>
          <Divider sx={{ my: 2 }} />
          <Typography>
            Вы уверены, что хотите удалить сущность "{deleteEntityModal.entityName}"?
          </Typography>
          <Alert color="warning" variant="soft" sx={{ mt: 2 }}>
            Все права доступа для этой сущности будут удалены из роли
          </Alert>
          <Stack direction="row" spacing={1} sx={{ mt: 2 }}>
            <Button 
              variant="outlined" 
              onClick={() => setDeleteEntityModal({ open: false, entityId: null, entityName: '' })}
            >
              Отмена
            </Button>
            <Button 
              color="danger" 
              onClick={() => deleteEntityModal.entityId && handleDeleteEntity(deleteEntityModal.entityId)}
            >
              Удалить
            </Button>
          </Stack>
        </ModalDialog>
      </Modal>
    </Page>
  );
};

export default RoleEditPage;
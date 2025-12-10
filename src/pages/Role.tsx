import React, { useState } from 'react';
import {
  Typography,
  Table,
  Sheet,
  IconButton,
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
  Select,
  Option,
  Checkbox,
} from '@mui/joy';
import Page from "../components/Page.tsx";
import {
  Delete as DeleteIcon,
  Edit as EditIcon,
  Add as AddIcon,
  Save as SaveIcon,
} from '@mui/icons-material';

interface Role {
  id: number;
  name: string;
  entities: string[];
  users: number;
}

const initialRoles: Role[] = [
  { id: 1, name: 'Администратор', entities: ['Пользователи', 'Роли', 'Настройки', 'Логи'], users: 5 },
  { id: 2, name: 'Модератор', entities: ['Контент', 'Комментарии'], users: 12 },
];

const allEntities = [
  'Пользователи',
  'Роли', 
  'Настройки',
  'Медиа',
  'Комментарии',
  'Контент',
  'Категории',
  'Отчеты',
  'Дашборды',
  'Логи'
];

const RolesPage = () => {
  const [roles, setRoles] = useState<Role[]>(initialRoles);
  const [page, setPage] = useState(1);
  const rowsPerPage = 5;
  
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const [notification, setNotification] = useState('');
  
  const [formData, setFormData] = useState<{
    name: string;
    entities: string[];
  }>({
    name: '',
    entities: [],
  });

  // Пагинация
  const totalPages = Math.ceil(roles.length / rowsPerPage);
  const startIndex = (page - 1) * rowsPerPage;
  const displayedRoles = roles.slice(startIndex, startIndex + rowsPerPage);

  const handleOpenDelete = (role: Role) => {
    setSelectedRole(role);
    setDeleteModalOpen(true);
  };

  const handleOpenEdit = (role: Role | null) => {
    if (role) {
      setSelectedRole(role);
      setFormData({
        name: role.name,
        entities: [...role.entities],
      });
    } else {
      setSelectedRole(null);
      setFormData({
        name: '',
        entities: [],
      });
    }
    setEditModalOpen(true);
  };

  const handleCloseModals = () => {
    setDeleteModalOpen(false);
    setEditModalOpen(false);
    setSelectedRole(null);
  };

  const handleDelete = () => {
    if (selectedRole) {
      setRoles(roles.filter(role => role.id !== selectedRole.id));
      setNotification(`Роль "${selectedRole.name}" удалена`);
      setTimeout(() => setNotification(''), 3000);
      handleCloseModals();
    }
  };

  const handleSave = () => {
    if (selectedRole) {
      setRoles(roles.map(role => 
        role.id === selectedRole.id 
          ? { ...role, ...formData }
          : role
      ));
      setNotification(`Роль "${formData.name}" обновлена`);
    } else {
      const newRole: Role = {
        id: roles.length + 1,
        name: formData.name,
        entities: formData.entities,
        users: 0,
      };
      setRoles([...roles, newRole]);
      setNotification(`Роль "${formData.name}" создана`);
    }
    setTimeout(() => setNotification(''), 3000);
    handleCloseModals();
  };

  const handleFormChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleEntitiesChange = (event: React.SyntheticEvent | null, newValue: string[]) => {
    handleFormChange('entities', newValue);
  };

  const renderEntities = (entities: string[]) => {
    const visible = entities.slice(0, 3);
    const hasMore = entities.length > 3;
    
    return (
      <Stack direction="row" spacing={0.5}>
        {visible.map((entity, i) => (
          <Chip key={i} size="sm" variant="soft" color="primary">
            {entity}
          </Chip>
        ))}
        {hasMore && <Chip size="sm" variant="plain">...</Chip>}
      </Stack>
    );
  };

  const renderSelectedValues = (selectedOptions: any) => {

    const selectedValues = Array.isArray(selectedOptions) 
      ? selectedOptions.map(option => typeof option === 'string' ? option : option.value || option)
      : [];
    
    return (
      <Stack direction="row" spacing={0.5} flexWrap="wrap" useFlexGap>
        {selectedValues.map((value, index) => (
          <Chip key={index} size="sm" variant="soft">
            {value}
          </Chip>
        ))}
      </Stack>
    );
  };

  return (
    <Page headerText="Управление ролями">
      {notification && (
        <Alert color="success" variant="soft" sx={{ mb: 2 }}>
          {notification}
        </Alert>
      )}

      <Stack direction="row" justifyContent="space-between" sx={{ mb: 2 }}>
        <Typography level="body-sm">
          Всего ролей: {roles.length}
        </Typography>
        <Button
          startDecorator={<AddIcon />}
          onClick={() => handleOpenEdit(null)}
        >
          Создать роль
        </Button>
      </Stack>

      <Sheet variant="outlined" sx={{ borderRadius: 'sm' }}>
        <Table>
          <thead>
            <tr>
              <th style={{ padding: '12px', width: '25%' }}>Название роли</th>
              <th style={{ padding: '12px', width: '45%' }}>Сущности</th>
              <th style={{ padding: '12px', width: '15%', textAlign: 'center' }}>Пользователи</th>
              <th style={{ padding: '12px', width: '15%', textAlign: 'right' }}>Действия</th>
            </tr>
          </thead>
          <tbody>
            {displayedRoles.map((role) => (
              <tr key={role.id}>
                <td style={{ padding: '12px', width: '25%' }}>
                  <Typography>{role.name}</Typography>
                </td>
                <td style={{ padding: '12px', width: '45%' }}>
                  {renderEntities(role.entities)}
                </td>
                <td style={{ padding: '12px', width: '15%', textAlign: 'center' }}>
                  <Chip
                    size="sm"
                    variant="soft"
                    color="neutral"
                  >
                    {role.users} чел.
                  </Chip>
                </td>
                <td style={{ padding: '12px', width: '15%', textAlign: 'right' }}>
                  <Stack direction="row" spacing={1} justifyContent="flex-end">
                    <IconButton
                      size="sm"
                      color="danger"
                      onClick={() => handleOpenDelete(role)}
                      title="Удалить"
                    >
                      <DeleteIcon />
                    </IconButton>
                    <IconButton
                      size="sm"
                      color="primary"
                      onClick={() => handleOpenEdit(role)}
                      title="Редактировать"
                    >
                      <EditIcon />
                    </IconButton>
                  </Stack>
                </td>
              </tr>
            ))}
          </tbody>
        </Table>
      </Sheet>

      <Stack direction="row" spacing={2} justifyContent="center" sx={{ mt: 2 }}>
        {[...Array(totalPages)].map((_, i) => (
          <Button
            key={i}
            size="sm"
            variant={page === i + 1 ? "solid" : "outlined"}
            onClick={() => setPage(i + 1)}
          >
            {i + 1}
          </Button>
        ))}
      </Stack>

      <Modal open={deleteModalOpen} onClose={handleCloseModals}>
        <ModalDialog>
          <ModalClose />
          <Typography level="h4">Удалить роль?</Typography>
          <Divider sx={{ my: 2 }} />
          <Typography>
            Вы уверены, что хотите удалить роль "{selectedRole?.name}"?
            {selectedRole?.users && selectedRole.users > 0 && (
              <Typography color="danger" level="body-sm" sx={{ mt: 1 }}>
                Внимание: у этой роли есть {selectedRole.users} пользователей!
              </Typography>
            )}
          </Typography>
          <Stack direction="row" spacing={1} sx={{ mt: 2 }}>
            <Button variant="outlined" onClick={handleCloseModals}>
              Отмена
            </Button>
            <Button 
              color="danger" 
              onClick={handleDelete}
              disabled={selectedRole?.users ? selectedRole.users > 0 : false}
            >
              Удалить
            </Button>
          </Stack>
        </ModalDialog>
      </Modal>

      <Modal open={editModalOpen} onClose={handleCloseModals}>
        <ModalDialog sx={{ minWidth: 400 }}>
          <ModalClose />
          <Typography level="h4">
            {selectedRole ? 'Редактирование роли' : 'Создание новой роли'}
          </Typography>
          <Divider sx={{ my: 2 }} />
          
          <FormControl sx={{ mb: 2 }}>
            <FormLabel>Название роли</FormLabel>
            <Input
              value={formData.name}
              onChange={(e) => handleFormChange('name', e.target.value)}
              placeholder="Введите название роли"
            />
          </FormControl>

          <FormControl>
            <FormLabel>Доступные сущности</FormLabel>
            <Select
              multiple
              value={formData.entities}
              onChange={handleEntitiesChange}
              renderValue={renderSelectedValues}
            >
              {allEntities.map((entity) => (
                <Option key={entity} value={entity}>
                  <Checkbox
                    checked={formData.entities.includes(entity)}
                    sx={{ mr: 1 }}
                  />
                  {entity}
                </Option>
              ))}
            </Select>
          </FormControl>

          <Stack direction="row" spacing={1} sx={{ mt: 3 }}>
            <Button variant="outlined" onClick={handleCloseModals}>
              Отмена
            </Button>
            <Button 
              onClick={handleSave}
              disabled={!formData.name.trim()}
              startDecorator={<SaveIcon />}
            >
              {selectedRole ? 'Сохранить' : 'Создать'}
            </Button>
          </Stack>
        </ModalDialog>
      </Modal>
    </Page>
  );
};

export default RolesPage;
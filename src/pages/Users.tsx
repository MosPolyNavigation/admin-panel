import { useState } from 'react';
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
  Link
} from '@mui/joy';
import Page from "../components/Page.tsx";
import {
  Delete as DeleteIcon,
  Edit as EditIcon,
  GroupAdd as RoleIcon,
  CheckCircle as ActiveIcon,
  Cancel as InactiveIcon,
} from '@mui/icons-material';

interface User {
  id: number;
  username: string;
  active: boolean;
  roles: string[];
}

function Users() {
  const [users, setUsers] = useState<User[]>([
    { id: 1, username: 'ivan_petrov', active: true, roles: ['Администратор', 'Модератор'] },
    { id: 2, username: 'anna_smirnova', active: true, roles: ['Редактор'] },
    { id: 3, username: 'sergey_ivanov', active: false, roles: ['Гость', 'Пользователь'] },

  ]);

  const [page, setPage] = useState(1);
  const rowsPerPage = 5;
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [notification, setNotification] = useState('');

  const totalPages = Math.ceil(users.length / rowsPerPage);
  const startIndex = (page - 1) * rowsPerPage;
  const currentUsers = users.slice(startIndex, startIndex + rowsPerPage);

  const handleDelete = (user: User) => {
    setSelectedUser(user);
    setDeleteModalOpen(true);
  };

  const confirmDelete = () => {
    if (selectedUser) {
      setUsers(users.filter(u => u.id !== selectedUser.id));
      setNotification(`Пользователь ${selectedUser.username} удален`);
      setTimeout(() => setNotification(''), 3000);
      setDeleteModalOpen(false);
    }
  };

  const toggleActive = (id: number) => {
    const user = users.find(u => u.id === id);
    if (user) {
      setUsers(users.map(user => 
        user.id === id ? { ...user, active: !user.active } : user
      ));
      setNotification(`Пользователь ${user.username} ${user.active ? 'деактивирован' : 'активирован'}`);
      setTimeout(() => setNotification(''), 3000);
    }
  };

  const renderRoles = (roles: string[]) => {
    const visible = roles.slice(0, 2);
    const hasMore = roles.length > 2;
    
    return (
      <Stack direction="row" spacing={0.5}>
        {visible.map((role, i) => (
          <Chip key={i} size="sm" variant="soft">
            {role}
          </Chip>
        ))}
        {hasMore && <Chip size="sm" variant="plain">...</Chip>}
      </Stack>
    );
  };

  return (
    <Page headerText="Просмотр пользователей">
      {notification && (
        <Alert color="success" variant="soft" sx={{ mb: 2 }}>
          {notification}
        </Alert>
      )}

      <Sheet variant="outlined" sx={{ borderRadius: 'sm' }}>
        <Table>
          <thead>
            <tr>
              <th style={{ padding: '12px' }}>Ник</th>
              <th style={{ padding: '12px' }}>Статус</th>
              <th style={{ padding: '12px' }}>Роли</th>
              <th style={{ padding: '12px', textAlign: 'right' }}>Действия</th>
            </tr>
          </thead>
          <tbody>
            {currentUsers.map((user) => (
              <tr key={user.id}>
                <td style={{ padding: '12px' }}>
                  <Typography>{user.username}</Typography>
                </td>
                <td style={{ padding: '12px' }}>
                  <Chip
                    size="sm"
                    variant="soft"
                    color={user.active ? 'success' : 'danger'}
                    startDecorator={user.active ? <ActiveIcon /> : <InactiveIcon />}
                  >
                    {user.active ? 'Активен' : 'Неактивен'}
                  </Chip>
                </td>
                <td style={{ padding: '12px' }}>
                  {renderRoles(user.roles)}
                </td>
                <td style={{ padding: '12px', textAlign: 'right' }}>
                  <Stack direction="row" spacing={1} justifyContent="flex-end">
                    <IconButton
                      size="sm"
                      color="danger"
                      onClick={() => handleDelete(user)}
                      title="Удалить"
                    >
                      <DeleteIcon />
                    </IconButton>
                    <Link
                      href={`/UserEditPage`}
                      underline="none"
                    >
                      <IconButton
                        size="sm"
                        color="primary"
                        title="Редактировать"
                      >
                        <EditIcon />
                      </IconButton>
                    </Link>
                    <Link
                      href={`/RoleEditPage`}
                      underline="none"
                    >
                      <IconButton
                        size="sm"
                        color="neutral"
                        title="Назначить роль"
                      >
                        <RoleIcon />
                      </IconButton>
                    </Link>
                    <Button
                      size="sm"
                      variant={user.active ? "outlined" : "solid"}
                      color={user.active ? "warning" : "success"}
                      onClick={() => toggleActive(user.id)}
                    >
                      {user.active ? 'Деактивировать' : 'Активировать'}
                    </Button>
                  </Stack>
                </td>
              </tr>
            ))}
          </tbody>
        </Table>
      </Sheet>

      {/* Пагинация */}
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

      <Modal open={deleteModalOpen} onClose={() => setDeleteModalOpen(false)}>
        <ModalDialog>
          <ModalClose />
          <Typography level="h4">Удалить пользователя?</Typography>
          <Divider sx={{ my: 2 }} />
          <Typography>
            Удалить пользователя {selectedUser?.username}?
          </Typography>
          <Stack direction="row" spacing={1} sx={{ mt: 2 }}>
            <Button variant="outlined" onClick={() => setDeleteModalOpen(false)}>
              Отмена
            </Button>
            <Button color="danger" onClick={confirmDelete}>
              Удалить
            </Button>
          </Stack>
        </ModalDialog>
      </Modal>
    </Page>
  );
}

export default Users;
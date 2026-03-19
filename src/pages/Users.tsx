import { useState, useEffect, useCallback } from 'react';
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
  LinearProgress,
  Input,
  Select,
  Option,
  FormLabel,
  FormControl,
  Box,
} from '@mui/joy';
import Page from '../components/Page.tsx';
import PaginationControls, {
  type PaginationControlsProps,
} from '../components/PaginationControls.tsx';
import {
  Delete as DeleteIcon,
  Edit as EditIcon,
  GroupAdd as RoleIcon,
  CheckCircle as ActiveIcon,
  Cancel as InactiveIcon,
  Visibility as ViewIcon,
  Search as SearchIcon,
  FilterList as FilterIcon,
  PersonAdd as AddUserIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router';
import { useAuth } from '../hooks/useAuth.ts';
import {
  getUsers,
  deleteUser,
  updateUser,
  type User,
  type PaginationInput,
  type UserFilterInput,
} from '../api.ts';

function Users() {
  const navigate = useNavigate();
  const { token, loading: authLoading } = useAuth();

  // State
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notification, setNotification] = useState<string | null>(null);
  const [notificationType, setNotificationType] = useState<'success' | 'danger'>('success');

  // Pagination
  const [pagination, setPagination] = useState<PaginationInput>({ limit: 10, offset: 0 });
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Filters
  const [filter, setFilter] = useState<UserFilterInput>({});
  const [searchLogin, setSearchLogin] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [showFilters, setShowFilters] = useState(false);

  // Modals
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  // Load users
  const loadUsers = useCallback(async () => {
    if (!token) return;

    setLoading(true);
    setError(null);
    try {
      const result = await getUsers(token, pagination, filter);
      setUsers(result.nodes);
      setTotalCount(result.paginationInfo.totalCount);
      setTotalPages(result.paginationInfo.totalPages);
      setCurrentPage(result.paginationInfo.currentPage);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка загрузки пользователей');
      showNotification('Ошибка загрузки пользователей', 'danger');
    } finally {
      setLoading(false);
    }
  }, [token, pagination, filter]);

  useEffect(() => {
    if (!authLoading && token) {
      loadUsers();
    }
  }, [loadUsers, authLoading, token]);

  // Show notification
  const showNotification = (message: string, type: 'success' | 'danger' = 'success') => {
    setNotification(message);
    setNotificationType(type);
    setTimeout(() => setNotification(null), 4000);
  };

  // Handle delete
  const handleDelete = (user: User) => {
    setSelectedUser(user);
    setDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    if (!selectedUser || !token) return;
    try {
      await deleteUser(token, selectedUser.id);
      showNotification(`Пользователь ${selectedUser.login} удалён`, 'success');
      loadUsers();
    } catch (err) {
      showNotification(err instanceof Error ? err.message : 'Ошибка удаления', 'danger');
    } finally {
      setDeleteModalOpen(false);
      setSelectedUser(null);
    }
  };

  // Handle toggle active
  const toggleActive = async (user: User) => {
    if (!token) return;
    try {
      await updateUser(token, user.id, { isActive: !user.isActive });
      showNotification(
        `Пользователь ${user.login} ${user.isActive ? 'деактивирован' : 'активирован'}`,
        'success'
      );
      loadUsers();
    } catch (err) {
      showNotification(err instanceof Error ? err.message : 'Ошибка обновления', 'danger');
    }
  };

  // Handle search
  const handleSearch = () => {
    const newFilter: UserFilterInput = {
      login: searchLogin || undefined,
      isActive: statusFilter === 'all' ? undefined : statusFilter === 'active',
    };
    setFilter(newFilter);
    setPagination({ ...pagination, offset: 0 });
    setCurrentPage(1);
  };

  // Handle reset filters
  const handleResetFilters = () => {
    setSearchLogin('');
    setStatusFilter('all');
    setFilter({});
    setPagination({ ...pagination, offset: 0 });
    setCurrentPage(1);
  };

  // Handle page change
  const handlePageChange: PaginationControlsProps['onPageChange'] = (page) => {
    setPagination({ ...pagination, offset: (page - 1) * itemsPerPage });
    setCurrentPage(page);
  };

  // Format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ru-RU', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // Show loading while auth is checking
  if (authLoading) {
    return (
      <Page headerText="Управление пользователями">
        <LinearProgress />
      </Page>
    );
  }

  // Show message if not authenticated
  if (!token) {
    return (
      <Page headerText="Управление пользователями">
        <Alert color="danger" variant="soft">
          Требуется авторизация для доступа к этой странице
        </Alert>
      </Page>
    );
  }

  return (
    <Page headerText="Управление пользователями">
      {/* Notification */}
      {notification && (
        <Alert color={notificationType} variant="soft" sx={{ mb: 2 }}>
          {notification}
        </Alert>
      )}

      {/* Header with Create Button */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography level="h4">Список пользователей</Typography>
        <Button
          variant="solid"
          color="primary"
          startDecorator={<AddUserIcon />}
          onClick={() => navigate('/users/create')}
        >
          Создать пользователя
        </Button>
      </Box>

      {/* Search and Filters Bar */}
      <Sheet variant="outlined" sx={{ borderRadius: 'sm', p: 2, mb: 2 }}>
        <Stack spacing={2}>
          {/* Main search row */}
          <Stack direction="row" spacing={2} alignItems="center">
            <Input
              placeholder="Поиск по логину..."
              value={searchLogin}
              onChange={(e) => setSearchLogin(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              startDecorator={<SearchIcon />}
              sx={{ flexGrow: 1 }}
            />
            <Button onClick={handleSearch} variant="solid">
              Найти
            </Button>
            <Button
              onClick={() => setShowFilters(!showFilters)}
              variant="outlined"
              startDecorator={<FilterIcon />}
            >
              {showFilters ? 'Скрыть фильтры' : 'Фильтры'}
            </Button>
            <Button onClick={handleResetFilters} variant="outlined">
              Сбросить
            </Button>
          </Stack>

          {/* Additional filters row */}
          {showFilters && (
            <Stack
              direction="row"
              spacing={2}
              alignItems="center"
              sx={{ pt: 2, borderTop: '1px solid', borderColor: 'divider' }}
            >
              <FormControl>
                <FormLabel>Статус</FormLabel>
                <Select
                  value={statusFilter}
                  onChange={(_, value) => value && setStatusFilter(value)}
                  sx={{ minWidth: 150 }}
                >
                  <Option value="all">Все</Option>
                  <Option value="active">Активные</Option>
                  <Option value="inactive">Неактивные</Option>
                </Select>
              </FormControl>
            </Stack>
          )}
        </Stack>
      </Sheet>

      {/* Loading */}
      {loading && <LinearProgress />}

      {/* Error */}
      {error && (
        <Alert color="danger" variant="soft" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {/* Users Table */}
      <Sheet variant="outlined" sx={{ borderRadius: 'sm', overflow: 'auto' }}>
        <Table stickyHeader>
          <thead>
            <tr>
              <th style={{ padding: '12px', width: '10%' }}>ID</th>
              <th style={{ padding: '12px', width: '10%' }}>Логин</th>
              <th style={{ padding: '12px', width: '10%' }}>ФИО</th>
              <th style={{ padding: '12px', width: '15%' }}>Дата регистрации</th>
              <th style={{ padding: '12px', width: '15%' }}>Последнее изменение</th>
              <th style={{ padding: '12px', width: '10%' }}>Роли</th>
              <th style={{ padding: '12px', width: '10%' }}>Статус</th>
              <th style={{ padding: '12px', width: '20%', textAlign: 'right' }}>Действия</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user.id}>
                <td style={{ padding: '12px' }}>
                  <Typography>{user.id}</Typography>
                </td>
                <td style={{ padding: '12px' }}>
                  <Typography fontWeight="md">{user.login}</Typography>
                </td>
                <td style={{ padding: '12px' }}>
                  <Typography>{user.fio || '—'}</Typography>
                </td>
                <td style={{ padding: '12px' }}>
                  <Typography level="body-sm">{formatDate(user.registrationDate)}</Typography>
                </td>
                <td style={{ padding: '12px' }}>
                  <Typography level="body-sm">{formatDate(user.updatedAt)}</Typography>
                </td>
                <td style={{ padding: '12px' }}>
                  {/* Вертикальное отображение ролей */}
                  <Stack direction="column" spacing={0.5}>
                    {user.roles && user.roles.length > 0 ? (
                      user.roles.slice(0, 3).map((ur) => (
                        <Chip key={ur.roleId} size="sm" variant="soft" color="primary">
                          {ur.role?.name || `Role ${ur.roleId}`}
                        </Chip>
                      ))
                    ) : (
                      <Typography level="body-sm" textColor="neutral.500">
                        Нет ролей
                      </Typography>
                    )}
                    {user.roles && user.roles.length > 3 && (
                      <Typography level="body-xs" textColor="neutral.400">
                        +{user.roles.length - 3} ещё
                      </Typography>
                    )}
                  </Stack>
                </td>
                <td style={{ padding: '12px' }}>
                  <Chip
                    size="sm"
                    variant="soft"
                    color={user.isActive ? 'success' : 'danger'}
                    startDecorator={user.isActive ? <ActiveIcon /> : <InactiveIcon />}
                  >
                    {user.isActive ? 'Активен' : 'Неактивен'}
                  </Chip>
                </td>
                <td style={{ padding: '12px', textAlign: 'right' }}>
                  <Stack direction="row" spacing={1} justifyContent="flex-end">
                    <IconButton
                      size="sm"
                      color="primary"
                      variant="outlined"
                      onClick={() => navigate(`/users/${user.id}`)}
                      title="Просмотр"
                    >
                      <ViewIcon />
                    </IconButton>
                    <IconButton
                      size="sm"
                      color="primary"
                      onClick={() => navigate(`/users/${user.id}/edit`)}
                      title="Редактировать"
                    >
                      <EditIcon />
                    </IconButton>
                    <IconButton
                      size="sm"
                      color="neutral"
                      variant="outlined"
                      onClick={() => navigate(`/users/${user.id}/roles`)}
                      title="Назначить роли"
                    >
                      <RoleIcon />
                    </IconButton>
                    <IconButton
                      size="sm"
                      color={user.isActive ? 'warning' : 'success'}
                      variant="outlined"
                      onClick={() => toggleActive(user)}
                      title={user.isActive ? 'Деактивировать' : 'Активировать'}
                    >
                      {user.isActive ? <InactiveIcon /> : <ActiveIcon />}
                    </IconButton>
                    <IconButton
                      size="sm"
                      color="danger"
                      onClick={() => handleDelete(user)}
                      title="Удалить"
                    >
                      <DeleteIcon />
                    </IconButton>
                  </Stack>
                </td>
              </tr>
            ))}
          </tbody>
        </Table>
      </Sheet>

      {/* Pagination */}
      <PaginationControls
        currentPage={currentPage}
        totalPages={totalPages}
        totalItems={totalCount}
        itemsPerPage={itemsPerPage}
        onPageChange={handlePageChange}
        showInfo={true}
        compact={false}
      />

      {/* Delete Modal */}
      <Modal open={deleteModalOpen} onClose={() => setDeleteModalOpen(false)}>
        <ModalDialog>
          <ModalClose />
          <Typography level="h4">Удалить пользователя?</Typography>
          <Divider sx={{ my: 2 }} />
          <Typography>
            Удалить пользователя <strong>{selectedUser?.login}</strong>? Это действие нельзя
            отменить.
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

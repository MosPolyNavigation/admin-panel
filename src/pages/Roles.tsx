import { useState, useEffect, useCallback, useMemo } from 'react';
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
  FormLabel,
  FormControl,
  Box,
} from '@mui/joy';
import Page from '../components/Page.tsx';
import PaginationControls, {
  type PaginationControlsProps,
} from '../components/PaginationControls.tsx';
import { RequirePermission } from '../components/RequirePermission.tsx';
import {
  Delete as DeleteIcon,
  Edit as EditIcon,
  Visibility as ViewIcon,
  Search as SearchIcon,
  FilterList as FilterIcon,
  Add as AddIcon,
} from '@mui/icons-material';
import { useNavigate, useSearchParams } from 'react-router';
import { useAuth } from '../hooks/useAuth.ts';
import {
  getRoles,
  deleteRole,
  type Role,
  type PaginationInput,
  type RoleFilterInput,
} from '../api';

const ITEMS_PER_PAGE = 10;

function Roles() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { token, loading: authLoading } = useAuth();

  // State
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notification, setNotification] = useState<string | null>(null);
  const [notificationType, setNotificationType] = useState<'success' | 'danger'>('success');

  // Pagination - читаем из URL
  const [currentPage, setCurrentPage] = useState(() => {
    const page = searchParams.get('page');
    return page ? Math.max(1, parseInt(page)) : 1;
  });
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  // Filters - читаем из URL
  const [searchName, setSearchName] = useState(() => searchParams.get('name') || '');
  const [showFilters, setShowFilters] = useState(() => {
    return searchParams.get('showFilters') === 'true';
  });

  // Modals
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);

  // Синхронизация состояния с URL
  useEffect(() => {
    const newParams = new URLSearchParams(searchParams);

    if (currentPage > 1) {
      newParams.set('page', String(currentPage));
    } else {
      newParams.delete('page');
    }

    if (searchName) {
      newParams.set('name', searchName);
    } else {
      newParams.delete('name');
    }

    if (showFilters) {
      newParams.set('showFilters', 'true');
    } else {
      newParams.delete('showFilters');
    }

    setSearchParams(newParams, { replace: true });
  }, [currentPage, searchName, showFilters, setSearchParams, searchParams]);

  // Вычисляем pagination из параметров (мемоизируем)
  const pagination = useMemo<PaginationInput>(
    () => ({
      limit: ITEMS_PER_PAGE,
      offset: (currentPage - 1) * ITEMS_PER_PAGE,
    }),
    [currentPage]
  );

  // Вычисляем filter из параметров (мемоизируем)
  const filter = useMemo<RoleFilterInput>(
    () => ({
      name: searchName || undefined,
    }),
    [searchName]
  );

  // Load roles
  const loadRoles = useCallback(async () => {
    if (!token) return;

    setLoading(true);
    setError(null);
    try {
      const result = await getRoles(token, pagination, filter);
      setRoles(result.nodes);
      setTotalCount(result.paginationInfo.totalCount);
      setTotalPages(result.paginationInfo.totalPages);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка загрузки ролей');
      showNotification('Ошибка загрузки ролей', 'danger');
    } finally {
      setLoading(false);
    }
  }, [token, pagination, filter]);

  useEffect(() => {
    if (!authLoading && token) {
      loadRoles();
    }
  }, [loadRoles, authLoading, token]);

  // Show notification
  const showNotification = (message: string, type: 'success' | 'danger' = 'success') => {
    setNotification(message);
    setNotificationType(type);
    setTimeout(() => setNotification(null), 4000);
  };

  // Handle delete
  const handleDelete = (role: Role) => {
    setSelectedRole(role);
    setDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    if (!selectedRole || !token) return;
    try {
      await deleteRole(token, selectedRole.id);
      showNotification(`Роль ${selectedRole.name} удалена`, 'success');
      loadRoles();
    } catch (err) {
      showNotification(err instanceof Error ? err.message : 'Ошибка удаления', 'danger');
    } finally {
      setDeleteModalOpen(false);
      setSelectedRole(null);
    }
  };

  // Handle search
  const handleSearch = () => {
    setCurrentPage(1);
    loadRoles();
  };

  // Handle reset filters
  const handleResetFilters = () => {
    setSearchName('');
    setShowFilters(false);
    setCurrentPage(1);
  };

  // Handle page change
  const handlePageChange: PaginationControlsProps['onPageChange'] = (page) => {
    setCurrentPage(page);
  };

  // Handle navigate with preserved state via URL params
  const handleNavigate = (path: string) => {
    const returnParams = new URLSearchParams();
    if (currentPage > 1) returnParams.set('page', String(currentPage));
    if (searchName) returnParams.set('name', searchName);
    if (showFilters) returnParams.set('showFilters', 'true');

    const returnQuery = returnParams.toString();
    const targetPath = returnQuery ? `${path}?from=/roles&${returnQuery}` : `${path}?from=/roles`;

    navigate(targetPath);
  };

  // Helper: count rights for role
  const getRightsCount = (role: Role): number => {
    return role.roleRightGoals?.length || 0;
  };

  // Helper: count users for role
  const getUsersCount = (role: Role): number => {
    return role.userRoles?.length || 0;
  };

  // Show loading while auth is checking
  if (authLoading) {
    return (
      <Page headerText="Управление ролями">
        <LinearProgress />
      </Page>
    );
  }

  // Show message if not authenticated
  if (!token) {
    return (
      <Page headerText="Управление ролями">
        <Alert color="danger" variant="soft">
          Требуется авторизация для доступа к этой странице
        </Alert>
      </Page>
    );
  }

  return (
    <Page headerText="Управление ролями">
      {/* Notification */}
      {notification && (
        <Alert color={notificationType} variant="soft" sx={{ mb: 2 }}>
          {notification}
        </Alert>
      )}

      {/* Header with Create Button */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography level="h4">Список ролей</Typography>
        <RequirePermission goal="roles" right="create">
          <Button
            variant="solid"
            color="primary"
            startDecorator={<AddIcon />}
            onClick={() => handleNavigate('/roles/create')}
          >
            Создать роль
          </Button>
        </RequirePermission>
      </Box>

      {/* Search and Filters Bar */}
      <Sheet variant="outlined" sx={{ borderRadius: 'sm', p: 2, mb: 2 }}>
        <Stack spacing={2}>
          {/* Main search row */}
          <Stack direction="row" spacing={2} alignItems="center">
            <Input
              placeholder="Поиск по названию..."
              value={searchName}
              onChange={(e) => setSearchName(e.target.value)}
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
                <FormLabel>ID роли</FormLabel>
                <Input
                  type="number"
                  placeholder="Например: 1"
                  sx={{ minWidth: 100 }}
                  // Можно добавить обработку по ID при необходимости
                />
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

      {/* Roles Table */}
      <Sheet variant="outlined" sx={{ borderRadius: 'sm', overflow: 'auto' }}>
        <Table stickyHeader>
          <thead>
            <tr>
              <th style={{ padding: '12px', width: '10%' }}>ID</th>
              <th style={{ padding: '12px', width: '25%' }}>Название</th>
              <th style={{ padding: '12px', width: '15%' }}>Количество прав</th>
              <th style={{ padding: '12px', width: '15%' }}>Пользователей</th>
              <th style={{ padding: '12px', width: '35%', textAlign: 'right' }}>Действия</th>
            </tr>
          </thead>
          <tbody>
            {roles.map((role) => (
              <tr key={role.id}>
                <td style={{ padding: '12px' }}>
                  <Typography>{role.id}</Typography>
                </td>
                <td style={{ padding: '12px' }}>
                  <Typography fontWeight="md">{role.name}</Typography>
                </td>
                <td style={{ padding: '12px' }}>
                  <Chip size="sm" variant="soft" color="primary">
                    {getRightsCount(role)}
                  </Chip>
                </td>
                <td style={{ padding: '12px' }}>
                  <Chip size="sm" variant="soft" color="neutral">
                    {getUsersCount(role)}
                  </Chip>
                </td>
                <td style={{ padding: '12px', textAlign: 'right' }}>
                  <Stack direction="row" spacing={1} justifyContent="flex-end">
                    <IconButton
                      size="sm"
                      color="primary"
                      variant="outlined"
                      onClick={() => handleNavigate(`/roles/${role.id}`)}
                      title="Просмотр"
                    >
                      <ViewIcon />
                    </IconButton>
                    <RequirePermission goal="roles" right="edit">
                      <IconButton
                        size="sm"
                        color="primary"
                        onClick={() => handleNavigate(`/roles/${role.id}/edit`)}
                        title="Редактировать"
                      >
                        <EditIcon />
                      </IconButton>
                    </RequirePermission>
                    <RequirePermission goal="roles" right="delete">
                      <IconButton
                        size="sm"
                        color="danger"
                        onClick={() => handleDelete(role)}
                        title="Удалить"
                      >
                        <DeleteIcon />
                      </IconButton>
                    </RequirePermission>
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
        itemsPerPage={ITEMS_PER_PAGE}
        onPageChange={handlePageChange}
        showInfo={true}
        compact={false}
      />

      {/* Delete Modal */}
      <Modal open={deleteModalOpen} onClose={() => setDeleteModalOpen(false)}>
        <ModalDialog>
          <ModalClose />
          <Typography level="h4">Удалить роль?</Typography>
          <Divider sx={{ my: 2 }} />
          <Typography>
            Удалить роль <strong>{selectedRole?.name}</strong>? Это действие нельзя отменить.
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

export default Roles;

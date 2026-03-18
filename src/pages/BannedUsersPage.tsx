import { useState, useEffect, useCallback } from 'react';
import {
  Typography,
  Table,
  Sheet,
  IconButton,
  Button,
  Stack,
  Alert,
  CircularProgress,
  Box,
  Chip,
  Card,
  Input,
  Select,
  Option,
  Badge,
  Divider,
} from '@mui/joy';
import {
  Visibility as ViewIcon,
  PersonOff as BanIcon,
  Search as SearchIcon,
  FirstPage as FirstPageIcon,
  LastPage as LastPageIcon,
  ChevronLeft as ChevronLeftIcon,
  ChevronRight as ChevronRightIcon,
  Refresh as RefreshIcon,
  FilterList as FilterIcon,
} from '@mui/icons-material';
import Page from '../components/Page';
import { useAuth } from '../hooks/useAuth';
import { getBannedUsers, type BanInfo } from '../api';
import { useNavigate } from 'react-router';

const ROWS_PER_PAGE_OPTIONS = [10, 25, 50, 100];
const DEFAULT_ROWS_PER_PAGE = 25;

function BannedUsersPage() {
  const { token } = useAuth();
  const navigate = useNavigate();

  const [bans, setBans] = useState<BanInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [total, setTotal] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(DEFAULT_ROWS_PER_PAGE);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterReason, setFilterReason] = useState<string>('all');
  const [refreshing, setRefreshing] = useState(false);

  const fetchBans = useCallback(
    async (page: number = currentPage, size: number = rowsPerPage) => {
      if (!token) return;
      try {
        setLoading(true);
        const data = await getBannedUsers(token, page, size);
        setBans(data.items);
        setTotal(data.total);
        setCurrentPage(data.page);
        setTotalPages(data.pages);
        setError(null);
      } catch {
        setError('Ошибка загрузки списка забаненных пользователей');
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [token, currentPage, rowsPerPage]
  );

  useEffect(() => {
    fetchBans();
  }, [fetchBans]);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchBans();
  };

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) {
      fetchBans(newPage);
    }
  };

  const handleRowsPerPageChange = (newSize: number) => {
    setRowsPerPage(newSize);
    fetchBans(1, newSize);
  };

  const filteredBans = bans.filter((ban) => {
    const matchesSearch =
      searchQuery === '' ||
      ban.user_id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (ban.ban_reason && ban.ban_reason.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesReason =
      filterReason === 'all' ||
      (filterReason === 'burst' && ban.ban_reason?.includes('Burst')) ||
      (filterReason === 'violations' && ban.ban_reason?.includes('violations'));

    return matchesSearch && matchesReason;
  });

  const formatDate = (dateString: string | null) => {
    if (!dateString) return '—';
    try {
      return new Date(dateString).toLocaleDateString('ru-RU', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return dateString;
    }
  };

  const getReasonColor = (reason: string | null) => {
    if (!reason) return 'neutral';
    if (reason.includes('Burst')) return 'danger';
    if (reason.includes('violations')) return 'warning';
    return 'neutral';
  };

  const renderPageNumbers = () => {
    if (totalPages <= 5) {
      return Array.from({ length: totalPages }, (_, i) => i + 1).map((i) => (
        <Button
          key={i}
          size="sm"
          variant={currentPage === i ? 'solid' : 'outlined'}
          onClick={() => handlePageChange(i)}
        >
          {i}
        </Button>
      ));
    }

    const pages = [
      <Button
        key={1}
        size="sm"
        variant={currentPage === 1 ? 'solid' : 'outlined'}
        onClick={() => handlePageChange(1)}
      >
        1
      </Button>,
    ];

    if (currentPage > 3) {
      pages.push(
        <Typography key="e1" sx={{ alignSelf: 'center' }}>
          ...
        </Typography>
      );
    }

    const start = Math.max(2, currentPage - 1);
    const end = Math.min(totalPages - 1, currentPage + 1);
    for (let i = start; i <= end; i++) {
      if (i > 1 && i < totalPages) {
        pages.push(
          <Button
            key={i}
            size="sm"
            variant={currentPage === i ? 'solid' : 'outlined'}
            onClick={() => handlePageChange(i)}
          >
            {i}
          </Button>
        );
      }
    }

    if (currentPage < totalPages - 2) {
      pages.push(
        <Typography key="e2" sx={{ alignSelf: 'center' }}>
          ...
        </Typography>
      );
    }

    pages.push(
      <Button
        key={totalPages}
        size="sm"
        variant={currentPage === totalPages ? 'solid' : 'outlined'}
        onClick={() => handlePageChange(totalPages)}
      >
        {totalPages}
      </Button>
    );

    return pages;
  };

  if (loading) {
    return (
      <Page headerText="Забаненные пользователи">
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            minHeight: '300px',
          }}
        >
          <CircularProgress />
        </Box>
      </Page>
    );
  }

  return (
    <Page headerText="Забаненные пользователи">
      {error && (
        <Alert color="danger" variant="soft" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <Card variant="outlined" sx={{ mb: 3 }}>
        <Stack spacing={2}>
          <Stack direction="row" spacing={2} alignItems="center" justifyContent="space-between">
            <Stack direction="row" spacing={2} alignItems="center">
              <Badge badgeContent={total} color="danger" size="sm">
                <Typography level="title-lg">Забаненные пользователи</Typography>
              </Badge>
              <Chip size="sm" variant="soft" color="neutral">
                <BanIcon fontSize="small" sx={{ mr: 0.5 }} />
                Всего: {total}
              </Chip>
            </Stack>
            <IconButton
              size="sm"
              variant="outlined"
              onClick={handleRefresh}
              disabled={refreshing}
              title="Обновить"
            >
              <RefreshIcon fontSize="small" />
            </IconButton>
          </Stack>

          <Divider />

          <Stack direction="row" spacing={2} flexWrap="wrap">
            <Input
              placeholder="Поиск по user_id или причине..."
              startDecorator={<SearchIcon fontSize="small" />}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              sx={{ flexGrow: 1, minWidth: '200px' }}
            />
            <Select
              value={filterReason}
              onChange={(_, val) => setFilterReason(val || 'all')}
              startDecorator={<FilterIcon fontSize="small" />}
              sx={{ minWidth: '200px' }}
            >
              <Option value="all">Все причины</Option>
              <Option value="burst">Burst-атака</Option>
              <Option value="violations">Превышение лимитов</Option>
            </Select>
            <Select
              value={rowsPerPage}
              onChange={(_, val) => handleRowsPerPageChange(Number(val))}
              sx={{ minWidth: '120px' }}
            >
              {ROWS_PER_PAGE_OPTIONS.map((size) => (
                <Option key={size} value={size}>
                  {size} / стр
                </Option>
              ))}
            </Select>
          </Stack>
        </Stack>
      </Card>

      {filteredBans.length === 0 ? (
        <Card variant="outlined">
          <Box sx={{ p: 4, textAlign: 'center' }}>
            <BanIcon
              fontSize="large"
              sx={{
                color: 'var(--joy-palette-neutral-400)',
                display: 'block',
                margin: '0 auto 16px',
              }}
            />
            <Typography level="title-md" color="neutral">
              {searchQuery || filterReason !== 'all'
                ? 'Ничего не найдено по заданным фильтрам'
                : 'Нет забаненных пользователей'}
            </Typography>
            <Typography level="body-sm" color="neutral" sx={{ mt: 1 }}>
              {searchQuery || filterReason !== 'all'
                ? 'Попробуйте изменить параметры поиска'
                : 'Пользователи появляются здесь после нарушений'}
            </Typography>
          </Box>
        </Card>
      ) : (
        <>
          <Card variant="outlined">
            <Sheet variant="soft" sx={{ borderRadius: 'sm', overflow: 'auto' }}>
              <Table stickyHeader size="sm">
                <thead>
                  <tr>
                    <th style={{ padding: '8px', width: '30%' }}>User ID</th>
                    <th style={{ padding: '8px', width: '25%' }}>Причина бана</th>
                    <th style={{ padding: '8px', width: '15%' }}>Дата бана</th>
                    <th style={{ padding: '8px', width: '10%' }}>Нарушения</th>
                    <th style={{ padding: '8px', width: '10%' }}>Запросов</th>
                    <th style={{ padding: '8px', width: '10%', textAlign: 'right' }}>Действия</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredBans.map((ban) => (
                    <tr key={ban.user_id}>
                      <td style={{ padding: '8px' }}>
                        <Typography level="body-sm" fontWeight="md">
                          {ban.user_id.slice(0, 8)}...{ban.user_id.slice(-8)}
                        </Typography>
                      </td>
                      <td style={{ padding: '8px' }}>
                        <Chip
                          size="sm"
                          variant="soft"
                          // eslint-disable-next-line @typescript-eslint/no-explicit-any
                          color={getReasonColor(ban.ban_reason) as any}
                        >
                          {ban.ban_reason || '—'}
                        </Chip>
                      </td>
                      <td style={{ padding: '8px' }}>
                        <Typography level="body-sm">{formatDate(ban.ban_timestamp)}</Typography>
                      </td>
                      <td style={{ padding: '8px' }}>
                        <Typography level="body-sm">{ban.violation_count}</Typography>
                      </td>
                      <td style={{ padding: '8px' }}>
                        <Typography level="body-sm">{ban.requests_count}</Typography>
                      </td>
                      <td style={{ padding: '8px', textAlign: 'right' }}>
                        <Stack direction="row" spacing={1} justifyContent="flex-end">
                          <IconButton
                            color="primary"
                            onClick={() => navigate(`/bans/${ban.user_id}`)}
                            title="Подробнее"
                          >
                            <ViewIcon fontSize="small" />
                          </IconButton>
                        </Stack>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </Sheet>
          </Card>

          {totalPages > 1 && (
            <Card variant="outlined" sx={{ mt: 2 }}>
              <Stack direction="row" spacing={1} justifyContent="center" alignItems="center">
                <IconButton
                  variant="outlined"
                  disabled={currentPage === 1}
                  onClick={() => handlePageChange(1)}
                  title="Первая"
                >
                  <FirstPageIcon fontSize="small" />
                </IconButton>
                <IconButton
                  variant="outlined"
                  disabled={currentPage === 1}
                  onClick={() => handlePageChange(currentPage - 1)}
                  title="Назад"
                >
                  <ChevronLeftIcon fontSize="small" />
                </IconButton>

                {renderPageNumbers()}

                <IconButton
                  variant="outlined"
                  disabled={currentPage === totalPages}
                  onClick={() => handlePageChange(currentPage + 1)}
                  title="Вперёд"
                >
                  <ChevronRightIcon fontSize="small" />
                </IconButton>
                <IconButton
                  variant="outlined"
                  disabled={currentPage === totalPages}
                  onClick={() => handlePageChange(totalPages)}
                  title="Последняя"
                >
                  <LastPageIcon fontSize="small" />
                </IconButton>
              </Stack>
              <Typography level="body-xs" sx={{ mt: 1, textAlign: 'center', color: 'neutral.500' }}>
                Показано {filteredBans.length} из {total} записей • Страница {currentPage} из{' '}
                {totalPages}
              </Typography>
            </Card>
          )}
        </>
      )}
    </Page>
  );
}

export default BannedUsersPage;

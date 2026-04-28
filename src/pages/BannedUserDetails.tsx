import { useState, useEffect } from 'react';
import {
  Typography,
  Card,
  Stack,
  Alert,
  CircularProgress,
  Box,
  Chip,
  Divider,
  Button,
  Modal,
  ModalDialog,
  ModalClose,
  Textarea,
  Badge,
} from '@mui/joy';
import {
  ArrowBack as BackIcon,
  PersonOff as BanIcon,
  CheckCircle as UnbanIcon,
  CalendarToday as DateIcon,
  ReportProblem as WarningIcon,
  Insights as ActivityIcon,
} from '@mui/icons-material';
import Page from '../components/Page';
import { getBanInfo, unbanUser, type BanInfo } from '../api';
import { useNavigate, useParams } from 'react-router';

function BannedUserDetails() {
  const navigate = useNavigate();
  const { user_id } = useParams<{ user_id: string }>();

  const [banInfo, setBanInfo] = useState<BanInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [unbanModalOpen, setUnbanModalOpen] = useState(false);
  const [unbanReason, setUnbanReason] = useState('');
  const [unbanning, setUnbanning] = useState(false);

  useEffect(() => {
    const fetchBanInfo = async () => {
      if (!user_id) return;
      try {
        setLoading(true);
        const data = await getBanInfo(user_id);
        if (data) {
          setBanInfo(data);
        } else {
          setError('Пользователь не найден или не забанен');
        }
        setError(null);
      } catch {
        setError('Ошибка загрузки информации о бане');
      } finally {
        setLoading(false);
      }
    };
    fetchBanInfo();
  }, [user_id]);

  const handleUnban = async () => {
    if (!user_id) return;
    try {
      setUnbanning(true);
      await unbanUser(user_id, unbanReason || undefined);
      setUnbanModalOpen(false);
      setUnbanReason('');
      navigate('/bans', { state: { success: 'Пользователь разбанен' } });
    } catch {
      setError('Ошибка при разбане пользователя');
    } finally {
      setUnbanning(false);
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return '—';
    try {
      return new Date(dateString).toLocaleString('ru-RU', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
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

  if (loading) {
    return (
      <Page headerText="Информация о бане">
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

  if (error || !banInfo) {
    return (
      <Page headerText="Информация о бане">
        <Alert color="danger" variant="soft" sx={{ mb: 2 }}>
          {error || 'Пользователь не найден'}
        </Alert>
        <Button
          variant="outlined"
          startDecorator={<BackIcon fontSize="small" />}
          onClick={() => navigate('/bans')}
        >
          Назад к списку
        </Button>
      </Page>
    );
  }

  return (
    <Page headerText="Информация о бане">
      <Button
        variant="outlined"
        startDecorator={<BackIcon fontSize="small" />}
        onClick={() => navigate('/bans')}
        sx={{ mb: 2 }}
      >
        Назад к списку
      </Button>

      {error && (
        <Alert color="danger" variant="soft" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <Stack spacing={3}>
        <Card variant="outlined">
          <Stack spacing={2}>
            <Stack direction="row" spacing={2} alignItems="center">
              <Badge badgeContent="BAN" color="danger" size="sm">
                <Typography level="title-lg">Пользователь забанен</Typography>
              </Badge>
              <Chip
                size="sm"
                variant="soft"
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                color={getReasonColor(banInfo.ban_reason) as any}
              >
                <BanIcon fontSize="small" sx={{ mr: 0.5 }} />
                {banInfo.ban_reason || 'Неизвестная причина'}
              </Chip>
            </Stack>

            <Divider />

            <Stack spacing={2}>
              <Stack direction="row" spacing={2} alignItems="center">
                <Typography level="body-sm" color="neutral">
                  User ID:
                </Typography>
                <Typography level="body-sm" fontWeight="md">
                  {banInfo.user_id}
                </Typography>
              </Stack>

              <Stack direction="row" spacing={2} alignItems="center">
                <DateIcon fontSize="small" sx={{ color: 'var(--joy-palette-neutral-500)' }} />
                <Typography level="body-sm" color="neutral">
                  Дата бана:
                </Typography>
                <Typography level="body-sm" fontWeight="md">
                  {formatDate(banInfo.ban_timestamp)}
                </Typography>
              </Stack>

              <Stack direction="row" spacing={2} alignItems="center">
                <WarningIcon fontSize="small" sx={{ color: 'var(--joy-palette-warning-500)' }} />
                <Typography level="body-sm" color="neutral">
                  Нарушений:
                </Typography>
                <Typography level="body-sm" fontWeight="md">
                  {banInfo.violation_count}
                </Typography>
              </Stack>

              <Stack direction="row" spacing={2} alignItems="center">
                <ActivityIcon fontSize="small" sx={{ color: 'var(--joy-palette-primary-500)' }} />
                <Typography level="body-sm" color="neutral">
                  Запросов в истории:
                </Typography>
                <Typography level="body-sm" fontWeight="md">
                  {banInfo.requests_count}
                </Typography>
              </Stack>

              <Stack direction="row" spacing={2} alignItems="center">
                <Typography level="body-sm" color="neutral">
                  Последний запрос:
                </Typography>
                <Typography level="body-sm" fontWeight="md">
                  {formatDate(banInfo.last_request)}
                </Typography>
              </Stack>
            </Stack>
          </Stack>
        </Card>

        <Card variant="outlined">
          <Stack spacing={2}>
            <Typography level="title-md">Действия</Typography>
            <Divider />
            <Stack direction="row" spacing={2}>
              <Button
                color="success"
                variant="solid"
                startDecorator={<UnbanIcon fontSize="small" />}
                onClick={() => setUnbanModalOpen(true)}
              >
                Разбанить пользователя
              </Button>
            </Stack>
          </Stack>
        </Card>
      </Stack>

      {/* Modal для разбана */}
      <Modal open={unbanModalOpen} onClose={() => setUnbanModalOpen(false)}>
        <ModalDialog variant="outlined" role="alertdialog">
          <ModalClose />
          <Typography level="title-lg">Подтверждение разбана</Typography>
          <Typography level="body-sm" sx={{ mt: 1 }}>
            Вы уверены, что хотите снять бан с пользователя{' '}
            <Typography fontWeight="md">
              {banInfo.user_id.slice(0, 8)}...{banInfo.user_id.slice(-8)}
            </Typography>
            ?
          </Typography>

          <Textarea
            placeholder="Причина разбана (для аудита, необязательно)"
            value={unbanReason}
            onChange={(e) => setUnbanReason(e.target.value)}
            minRows={2}
            sx={{ mt: 2 }}
          />

          <Stack direction="row" spacing={2} justifyContent="flex-end" sx={{ mt: 2 }}>
            <Button variant="outlined" onClick={() => setUnbanModalOpen(false)}>
              Отмена
            </Button>
            <Button color="success" variant="solid" onClick={handleUnban} loading={unbanning}>
              Подтвердить разбан
            </Button>
          </Stack>
        </ModalDialog>
      </Modal>
    </Page>
  );
}

export default BannedUserDetails;

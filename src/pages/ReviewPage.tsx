import { useState, useEffect } from 'react';
import {
  Typography,
  Box,
  Button,
  Stack,
  Card,
  CardContent,
  Divider,
  Alert,
  Chip,
  Select,
  Option,
  CircularProgress,
  AspectRatio,
  Modal,
  ModalDialog,
  ModalClose
} from '@mui/joy';
import {
  ArrowBack as BackIcon,
  Save as SaveIcon,
  CalendarToday as DateIcon,
  BugReport as ProblemIcon,
  Image as ImageIcon,
  ZoomIn as ZoomIcon
} from '@mui/icons-material';
import { useParams, useNavigate } from 'react-router';
import { useAuth } from '../contexts/AuthContext.tsx';
import { getReviews, getReviewStatuses, getReviewImageUrl, type Review, type ReviewStatus } from '../api.ts';

export default function ReviewPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { token } = useAuth();

  const [review, setReview] = useState<Review | null>(null);
  const [statuses, setStatuses] = useState<ReviewStatus[]>([]);
  const [selectedStatus, setSelectedStatus] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [statusLoading, setStatusLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [alert, setAlert] = useState<{ message: string; color: 'success' | 'danger' } | null>(null);
  const [imageModalOpen, setImageModalOpen] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      if (!token || !id) return;

      try {
        setLoading(true);
        
        const reviews = await getReviews(token);
        
        const reviewId = Number(id);
        const foundReview = reviews.find(r => Number(r.id) === reviewId);
        
        if (!foundReview) {
          setError('Отзыв не найден');
          return;
        }
        
        setReview(foundReview);

        try {
          const statusList = await getReviewStatuses(id, token);
          setStatuses(statusList);
          if (statusList.length > 0) {
            const currentStatus = statusList.find(s => s.current) || statusList[0];
            setSelectedStatus(currentStatus.value);
          }
        } catch (statusErr) {
          console.error('Ошибка загрузки статусов:', statusErr);
        }

        setError(null);
      } catch (err) {
        setError('Ошибка загрузки отзыва');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [token, id]);

  const handleStatusChange = async () => {
    if (!token || !id || !selectedStatus) return;

    try {
      setStatusLoading(true);
      // TODO метод для изменения статуса отзыва
      
      showAlert('Статус успешно обновлён', 'success');
    } catch (err) {
      showAlert('Ошибка при обновлении статуса', 'danger');
      console.error(err);
    } finally {
      setStatusLoading(false);
    }
  };

  const showAlert = (message: string, color: 'success' | 'danger') => {
    setAlert({ message, color });
    setTimeout(() => setAlert(null), 3000);
  };

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString('ru-RU', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return dateString;
    }
  };

  if (loading) {
    return (
      <Box sx={{ p: 3, display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '300px' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error || !review) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert color="danger" variant="soft">
          {error || 'Отзыв не найден'}
        </Alert>
        <Button
          variant="outlined"
          startDecorator={<BackIcon />}
          onClick={() => navigate('/reviews')}
          sx={{ mt: 2 }}
        >
          Вернуться к списку
        </Button>
      </Box>
    );
  }

  const imageUrl = review.imageName ? getReviewImageUrl(review.imageName) : null;

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3, flexWrap: 'wrap' }}>
        <Button
          variant="outlined"
          startDecorator={<BackIcon />}
          onClick={() => navigate('/reviews')}
        >
          Назад
        </Button>
        <Typography level="h2">Отзыв #{review.id}</Typography>
        <Chip
          variant="soft"
          color="primary"
          startDecorator={<ProblemIcon sx={{ fontSize: 16 }} />}
        >
          Problem ID: {review.problemId}
        </Chip>
      </Box>

      {alert && (
        <Alert color={alert.color} variant="soft" sx={{ mb: 3 }}>
          {alert.message}
        </Alert>
      )}

      <Stack spacing={3}>
        <Card variant="outlined">
          <CardContent>
            <Typography level="title-lg" sx={{ mb: 2 }}>
              Информация об отзыве
            </Typography>
            <Divider sx={{ mb: 3 }} />
            
            <Stack spacing={3}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <DateIcon sx={{ color: 'neutral.500' }} />
                <Box>
                  <Typography level="body-sm" color="neutral">
                    Дата создания
                  </Typography>
                  <Typography level="body-md">
                    {formatDate(review.creationDate)}
                  </Typography>
                </Box>
              </Box>

              <Box>
                <Typography level="body-sm" color="neutral" sx={{ mb: 1 }}>
                  Текст отзыва
                </Typography>
                <Card variant="soft" sx={{ p: 2 }}>
                  <Typography level="body-md" sx={{ whiteSpace: 'pre-wrap' }}>
                    {review.text}
                  </Typography>
                </Card>
              </Box>
            </Stack>
          </CardContent>
        </Card>

        <Card variant="outlined">
          <CardContent>
            <Typography level="title-lg" sx={{ mb: 2 }}>
              Управление статусом
            </Typography>
            <Divider sx={{ mb: 3 }} />
            
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems={{ xs: 'stretch', sm: 'flex-end' }}>
              <Box sx={{ flex: 1, minWidth: 200 }}>
                <Typography level="body-sm" color="neutral" sx={{ mb: 1 }}>
                  Статус отзыва
                </Typography>
                <Select
                  value={selectedStatus}
                  onChange={(_, value) => setSelectedStatus(value)}
                  placeholder="Выберите статус"
                  disabled={statuses.length === 0}
                >
                  {statuses.map((status) => (
                    <Option key={status.value} value={status.value}>
                      {status.label || status.value}
                    </Option>
                  ))}
                </Select>
              </Box>
              <Button
                variant="solid"
                color="primary"
                startDecorator={<SaveIcon />}
                onClick={handleStatusChange}
                loading={statusLoading}
                disabled={statuses.length === 0 || !selectedStatus}
              >
                Сохранить статус
              </Button>
            </Stack>
          </CardContent>
        </Card>

        <Card variant="outlined">
          <CardContent>
            <Typography level="title-lg" sx={{ mb: 2 }}>
              Изображение
            </Typography>
            <Divider sx={{ mb: 3 }} />
            
            {imageUrl ? (
              <Box>
                <AspectRatio ratio="16/9" sx={{ maxWidth: 600, borderRadius: 'sm', overflow: 'hidden' }}>
                  <img
                    src={imageUrl}
                    alt="Изображение отзыва"
                    style={{ objectFit: 'cover', cursor: 'pointer' }}
                    onClick={() => setImageModalOpen(true)}
                  />
                </AspectRatio>
                <Button
                  variant="soft"
                  size="sm"
                  startDecorator={<ZoomIcon />}
                  onClick={() => setImageModalOpen(true)}
                  sx={{ mt: 2 }}
                >
                  Открыть в полном размере
                </Button>
              </Box>
            ) : (
              <Box sx={{ 
                display: 'flex', 
                flexDirection: 'column', 
                alignItems: 'center', 
                justifyContent: 'center',
                py: 4,
                color: 'neutral.500'
              }}>
                <ImageIcon sx={{ fontSize: 48, mb: 1, opacity: 0.5 }} />
                <Typography level="body-md" color="neutral">
                  Изображение отсутствует
                </Typography>
              </Box>
            )}
          </CardContent>
        </Card>
      </Stack>

      <Modal open={imageModalOpen} onClose={() => setImageModalOpen(false)}>
        <ModalDialog
          sx={{
            maxWidth: '90vw',
            maxHeight: '90vh',
            p: 1,
            overflow: 'hidden'
          }}
        >
          <ModalClose />
          {imageUrl && (
            <Box sx={{ 
              display: 'flex', 
              justifyContent: 'center', 
              alignItems: 'center',
              maxHeight: 'calc(90vh - 60px)',
              overflow: 'auto'
            }}>
              <img
                src={imageUrl}
                alt="Изображение отзыва"
                style={{ 
                  maxWidth: '100%', 
                  maxHeight: 'calc(90vh - 60px)',
                  objectFit: 'contain' 
                }}
              />
            </Box>
          )}
        </ModalDialog>
      </Modal>
    </Box>
  );
}


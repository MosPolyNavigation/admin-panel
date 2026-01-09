import { useState, useEffect } from 'react';
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
  Chip
} from '@mui/joy';
import Page from "../components/Page.tsx";
import {
  Visibility as ViewIcon,
  Image as ImageIcon,
  CalendarToday as DateIcon
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext.tsx';
import { getReviews, type Review } from '../api.ts';
import { useNavigate } from 'react-router';
import { translateProblemId } from '../utils.ts';

function ReviewsPage() {
  const { token } = useAuth();
  const navigate = useNavigate();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [page, setPage] = useState(1);
  const rowsPerPage = 10;

  useEffect(() => {
    const fetchReviews = async () => {
      if (!token) return;
      
      try {
        setLoading(true);
        const data = await getReviews(token);
        setReviews(data);
        setError(null);
      } catch (err) {
        setError('Ошибка загрузки отзывов');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchReviews();
  }, [token]);

  const totalPages = Math.ceil(reviews.length / rowsPerPage);
  const startIndex = (page - 1) * rowsPerPage;
  const currentReviews = reviews.slice(startIndex, startIndex + rowsPerPage);

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

  const truncateText = (text: string, maxLength: number = 100) => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  };

  if (loading) {
    return (
      <Page headerText="Отзывы">
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '300px' }}>
          <CircularProgress />
        </Box>
      </Page>
    );
  }

  return (
    <Page headerText="Просмотр отзывов">
      {error && (
        <Alert color="danger" variant="soft" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <Sheet variant="outlined" sx={{ borderRadius: 'sm', overflow: 'auto' }}>
        <Table stickyHeader>
          <thead>
            <tr>
              <th style={{ padding: '12px', width: '80px' }}>ID</th>
              <th style={{ padding: '12px', width: '120px' }}>Problem ID</th>
              <th style={{ padding: '12px' }}>Текст отзыва</th>
              <th style={{ padding: '12px', width: '200px' }}>Дата создания</th>
              <th style={{ padding: '12px', width: '100px' }}>Изображение</th>
              <th style={{ padding: '12px', width: '100px', textAlign: 'right' }}>Действия</th>
            </tr>
          </thead>
          <tbody>
            {currentReviews.map((review) => (
              <tr key={review.id}>
                <td style={{ padding: '12px' }}>
                  <Typography level="body-sm" fontWeight="md">
                    {review.id}
                  </Typography>
                </td>
                <td style={{ padding: '12px' }}>
                  <Chip size="sm" variant="soft" color="primary">
                    {translateProblemId(review.problemId)}
                  </Chip>
                </td>
                <td style={{ padding: '12px' }}>
                  <Typography level="body-sm">
                    {truncateText(review.text)}
                  </Typography>
                </td>
                <td style={{ padding: '12px' }}>
                  <Stack direction="row" spacing={1} alignItems="center">
                    <DateIcon sx={{ fontSize: 16, color: 'neutral.500' }} />
                    <Typography level="body-sm">
                      {formatDate(review.creationDate)}
                    </Typography>
                  </Stack>
                </td>
                <td style={{ padding: '12px' }}>
                  {review.imageName ? (
                    <Chip
                      size="sm"
                      variant="soft"
                      color="success"
                      startDecorator={<ImageIcon sx={{ fontSize: 14 }} />}
                    >
                      Есть
                    </Chip>
                  ) : (
                    <Chip size="sm" variant="soft" color="neutral">
                      Нет
                    </Chip>
                  )}
                </td>
                <td style={{ padding: '12px', textAlign: 'right' }}>
                  <IconButton
                    size="sm"
                    color="primary"
                    onClick={() => navigate(`/reviews/${review.id}`)}
                    title="Просмотреть"
                  >
                    <ViewIcon />
                  </IconButton>
                </td>
              </tr>
            ))}
            {currentReviews.length === 0 && (
              <tr>
                <td colSpan={6} style={{ padding: '24px', textAlign: 'center' }}>
                  <Typography level="body-md" color="neutral">
                    Отзывы не найдены
                  </Typography>
                </td>
              </tr>
            )}
          </tbody>
        </Table>
      </Sheet>

      {totalPages > 1 && (
        <Stack direction="row" spacing={2} justifyContent="center" sx={{ mt: 2 }}>
          <Button
            size="sm"
            variant="outlined"
            disabled={page === 1}
            onClick={() => setPage(page - 1)}
          >
            Назад
          </Button>
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
          <Button
            size="sm"
            variant="outlined"
            disabled={page === totalPages}
            onClick={() => setPage(page + 1)}
          >
            Вперёд
          </Button>
        </Stack>
      )}

      <Typography level="body-sm" sx={{ mt: 2, textAlign: 'center', color: 'neutral.500' }}>
        Всего отзывов: {reviews.length}
      </Typography>
    </Page>
  );
}

export default ReviewsPage;


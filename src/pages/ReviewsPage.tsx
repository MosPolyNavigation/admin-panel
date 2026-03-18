import { useState, useEffect } from 'react';
import { Typography, Stack, Alert, CircularProgress, Box } from '@mui/joy';
import Page from '../components/Page';
import { useAuth } from '../hooks/useAuth';
import { getReviews, type Review } from '../api';
import { useNavigate, useSearchParams } from 'react-router';
import { translateProblemId } from '../utils';
import { STATUS_MAP } from '../constants';
import { ReviewStatusCard } from '../components/ReviewStatusCard';

const ROWS_PER_PAGE = 5;

function ReviewsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const { token } = useAuth();
  const navigate = useNavigate();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const getPage = (statusId: number): number => {
    const page = searchParams.get(`page_${statusId}`);
    return page ? Number(page) : 1;
  };

  const getExpanded = (statusId: number): boolean => {
    const val = searchParams.get(`expanded_${statusId}`);
    if (val !== null) return val === 'true';
    return statusId === 1;
  };

  useEffect(() => {
    const fetchReviews = async () => {
      if (!token) return;
      try {
        setLoading(true);
        const data = await getReviews(token);
        setReviews(data);
        setError(null);
      } catch {
        setError('Ошибка загрузки отзывов');
      } finally {
        setLoading(false);
      }
    };
    fetchReviews();
  }, [token]);

  const groupedReviews = reviews.reduce(
    (acc, review) => {
      const statusId = review.statusId || 1;
      (acc[statusId] ||= []).push(review);
      return acc;
    },
    {} as Record<number, Review[]>
  );

  const statusIds = Object.keys(STATUS_MAP)
    .map(Number)
    .sort((a, b) => a - b);

  const formatDate = (dateString: string) => {
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

  const truncateText = (text: string, maxLength = 100) =>
    text.length <= maxLength ? text : text.slice(0, maxLength) + '...';

  const handlePageChange = (statusId: number, newPage: number) => {
    setSearchParams((prev) => {
      prev.set(`page_${statusId}`, String(newPage));
      return prev;
    });
  };

  const toggleExpand = (statusId: number) => {
    setSearchParams((params) => {
      const current = getExpanded(statusId);
      params.set(`expanded_${statusId}`, String(!current));
      return params;
    });
  };

  const handleViewReview = (reviewId: number | string) => {
    navigate(`/reviews/${reviewId}?${searchParams.toString()}`);
  };

  if (loading) {
    return (
      <Page headerText="Отзывы">
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
    <Page headerText="Отзывы">
      {error && (
        <Alert color="danger" variant="soft" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <Stack spacing={3}>
        {statusIds.map((statusId) => {
          const statusName = STATUS_MAP[statusId];
          const statusReviews = groupedReviews[statusId] || [];
          const totalPages = Math.ceil(statusReviews.length / ROWS_PER_PAGE);
          const currentPage = getPage(statusId);
          const isExpanded = getExpanded(statusId);

          return (
            <ReviewStatusCard
              key={statusId}
              statusId={statusId}
              statusName={statusName}
              reviews={statusReviews}
              currentPage={currentPage}
              totalPages={totalPages}
              isExpanded={isExpanded}
              onPageChange={handlePageChange}
              onToggleExpand={toggleExpand}
              onViewReview={handleViewReview}
              formatDate={formatDate}
              truncateText={truncateText}
              translateProblemId={translateProblemId}
              searchParams={searchParams}
            />
          );
        })}
      </Stack>

      <Typography level="body-sm" sx={{ mt: 3, textAlign: 'center', color: 'neutral.500' }}>
        Всего отзывов: {reviews.length} • Статусов: {statusIds.length}
      </Typography>
    </Page>
  );
}

export default ReviewsPage;

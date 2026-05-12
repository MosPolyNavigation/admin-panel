import { useState, useEffect, useCallback, useRef } from 'react';
import { Typography, Stack, Alert, CircularProgress, Box } from '@mui/joy';
import Page from '../components/Page';
import { getReviews, getReviewsBatch, type Review } from '../api';
import { useNavigate, useSearchParams } from 'react-router';
import { translateProblemId } from '../utils';
import { STATUS_MAP } from '../constants';
import ReviewStatusCard from '../components/ReviewStatusCard';

const ROWS_PER_PAGE = 5;
const STATUS_IDS = Object.keys(STATUS_MAP)
  .map(Number)
  .sort((a, b) => a - b);

function ReviewsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  const [reviewsByStatus, setReviewsByStatus] = useState<Record<number, Review[]>>({});
  const [paginationByStatus, setPaginationByStatus] = useState<
    Record<number, { total: number; pages: number }>
  >({});

  const [initialLoading, setInitialLoading] = useState(true);
  const [loadingByStatus, setLoadingByStatus] = useState<Record<number, boolean>>({});
  const [error, setError] = useState<string | null>(null);
  const [loadedPageByStatus, setLoadedPageByStatus] = useState<Record<number, number>>({});
  const prevSearchParamsRef = useRef<URLSearchParams | null>(null);
  const fetchingPagesRef = useRef<Set<string>>(new Set());
  const loadedPagesRef = useRef<Record<number, number>>({});
  const loadingByStatusRef = useRef<Record<number, boolean>>({});

  const getPage = useCallback(
    (statusId: number): number => {
      const page = searchParams.get(`page_${statusId}`);
      return page ? Number(page) : 1;
    },
    [searchParams]
  );

  const getExpanded = (statusId: number): boolean => {
    const val = searchParams.get(`expanded_${statusId}`);
    if (val !== null) return val === 'true';
    return statusId === 1;
  };

  useEffect(() => {
    loadingByStatusRef.current = loadingByStatus;
  }, [loadingByStatus]);

  useEffect(() => {
    loadedPagesRef.current = loadedPageByStatus;
  }, [loadedPageByStatus]);

  const loadReviewsForStatus = useCallback(async (statusId: number, page: number) => {
    setLoadingByStatus((prev) => ({ ...prev, [statusId]: true }));

    try {
      const {
        reviews: newReviews,
        pagination,
        error: fetchError,
      } = await getReviews({ reviewStatusId: statusId }, { page, pageSize: ROWS_PER_PAGE });

      if (fetchError) {
        setError(fetchError);
        return;
      }

      setReviewsByStatus((prev) => ({ ...prev, [statusId]: newReviews }));

      if (pagination) {
        setPaginationByStatus((prev) => ({
          ...prev,
          [statusId]: { total: pagination.totalCount, pages: pagination.totalPages },
        }));
      }

      setLoadedPageByStatus((prev) => ({
        ...prev,
        [statusId]: page,
      }));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка загрузки отзывов');
    } finally {
      setLoadingByStatus((prev) => ({ ...prev, [statusId]: false }));
    }
  }, []);

  useEffect(() => {
    const fetchInitialReviews = async () => {
      try {
        setInitialLoading(true);
        setError(null);

        const batchResult = await getReviewsBatch(STATUS_IDS, 1, ROWS_PER_PAGE);

        if (!batchResult) {
          setError('Не удалось загрузить отзывы');
          return;
        }

        const newReviewsByStatus: Record<number, Review[]> = {};
        const newPaginationByStatus: Record<number, { total: number; pages: number }> = {};

        STATUS_IDS.forEach((statusId) => {
          const key = `status${statusId}`;
          const data = batchResult[key];
          if (data) {
            newReviewsByStatus[statusId] = data.reviews;
            if (data.total !== undefined && data.pages !== undefined) {
              newPaginationByStatus[statusId] = { total: data.total, pages: data.pages };
            }
          }
        });

        setReviewsByStatus(newReviewsByStatus);
        setPaginationByStatus(newPaginationByStatus);
        setLoadedPageByStatus((prev) => {
          const updated = { ...prev };
          STATUS_IDS.forEach((statusId) => {
            updated[statusId] = 1;
          });
          return updated;
        });
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Ошибка загрузки отзывов');
      } finally {
        setInitialLoading(false);
      }
    };

    fetchInitialReviews();
  }, []);

  useEffect(() => {
    if (initialLoading) return;

    const statusesToLoad: number[] = [];
    const prevParams = prevSearchParamsRef.current;

    STATUS_IDS.forEach((statusId) => {
      const currentPage = Number(searchParams.get(`page_${statusId}`)) || 1;
      const prevPage = prevParams ? Number(prevParams.get(`page_${statusId}`)) || 1 : 0;

      if (prevPage === 0 || currentPage !== prevPage) {
        statusesToLoad.push(statusId);
      }
    });

    prevSearchParamsRef.current = searchParams;

    statusesToLoad.forEach((statusId) => {
      const page = Number(searchParams.get(`page_${statusId}`)) || 1;
      const cacheKey = `${statusId}_${page}`;

      if (fetchingPagesRef.current.has(cacheKey) || loadedPagesRef.current[statusId] === page) {
        return;
      }

      fetchingPagesRef.current.add(cacheKey);

      loadReviewsForStatus(statusId, page).finally(() => {
        fetchingPagesRef.current.delete(cacheKey);
      });
    });
  }, [searchParams, initialLoading, loadReviewsForStatus]);

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

  if (initialLoading) {
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
        {STATUS_IDS.map((statusId) => {
          const statusName = STATUS_MAP[statusId];
          const statusReviews = reviewsByStatus[statusId] || [];
          const pagination = paginationByStatus[statusId];

          const currentPage = getPage(statusId);
          const totalPages = pagination?.pages || 1;
          const totalReviewsCount = pagination?.total || 0;

          const paginatedReviews = statusReviews;

          const isExpanded = getExpanded(statusId);

          return (
            <ReviewStatusCard
              key={statusId}
              statusId={statusId}
              statusName={statusName}
              reviews={paginatedReviews}
              totalReviewsCount={totalReviewsCount}
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
        Всего отзывов: {Object.values(reviewsByStatus).flat().length} • Статусов:{' '}
        {STATUS_IDS.length}
      </Typography>
    </Page>
  );
}

export default ReviewsPage;

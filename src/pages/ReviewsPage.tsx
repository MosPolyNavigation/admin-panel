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
  Chip,
  Card,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Badge,
} from '@mui/joy';
import {
  Visibility as ViewIcon,
  Image as ImageIcon,
  CalendarToday as DateIcon,
  ExpandMore as ExpandMoreIcon,
  FirstPage as FirstPageIcon,
  LastPage as LastPageIcon,
  ChevronLeft as ChevronLeftIcon,
  ChevronRight as ChevronRightIcon,
} from '@mui/icons-material';
import Page from '../components/Page';
import { useAuth } from '../hooks/useAuth';
import { getReviews, type Review } from '../api';
import { useNavigate, useSearchParams } from 'react-router';
import { translateProblemId } from '../utils';

// Константы
const STATUS_MAP: Record<number, string> = {
  1: 'бэклог',
  2: 'на рассмотрении',
  3: 'принят в работу',
  4: 'ждет проверки',
  5: 'исправлен',
  6: 'не требует исправления',
  7: 'исправление отложено',
};

const STATUS_COLORS: Record<number, string> = {
  1: 'neutral',
  2: 'primary',
  3: 'warning',
  4: 'info',
  5: 'success',
  6: 'success',
  7: 'danger',
};

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
    return statusId === 1; // дефолт: первый статус раскрыт
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

  const renderPageNumbers = (total: number, current: number, onChange: (page: number) => void) => {
    if (total <= 5) {
      return Array.from({ length: total }, (_, i) => i + 1).map((i) => (
        <Button
          key={i}
          size="sm"
          variant={current === i ? 'solid' : 'outlined'}
          onClick={() => onChange(i)}
        >
          {i}
        </Button>
      ));
    }

    const pages = [
      <Button
        key={1}
        size="sm"
        variant={current === 1 ? 'solid' : 'outlined'}
        onClick={() => onChange(1)}
      >
        1
      </Button>,
    ];

    if (current > 3)
      pages.push(
        <Typography key="e1" sx={{ alignSelf: 'center' }}>
          ...
        </Typography>
      );

    const start = Math.max(2, current - 1);
    const end = Math.min(total - 1, current + 1);
    for (let i = start; i <= end; i++) {
      if (i > 1 && i < total) {
        pages.push(
          <Button
            key={i}
            size="sm"
            variant={current === i ? 'solid' : 'outlined'}
            onClick={() => onChange(i)}
          >
            {i}
          </Button>
        );
      }
    }

    if (current < total - 2)
      pages.push(
        <Typography key="e2" sx={{ alignSelf: 'center' }}>
          ...
        </Typography>
      );

    pages.push(
      <Button
        key={total}
        size="sm"
        variant={current === total ? 'solid' : 'outlined'}
        onClick={() => onChange(total)}
      >
        {total}
      </Button>
    );

    return pages;
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
          const startIndex = (currentPage - 1) * ROWS_PER_PAGE;
          const currentReviews = statusReviews.slice(startIndex, startIndex + ROWS_PER_PAGE);

          return (
            <Card key={statusId} variant="outlined" sx={{ overflow: 'hidden' }}>
              <Accordion expanded={isExpanded} onChange={() => toggleExpand(statusId)}>
                <AccordionSummary
                  indicator={<ExpandMoreIcon />}
                  sx={{
                    backgroundColor: 'background.level1',
                    '&:hover': { backgroundColor: 'background.level2' },
                  }}
                >
                  <Stack direction="row" spacing={2} alignItems="center" sx={{ flex: 1 }}>
                    <Badge
                      badgeContent={statusReviews.length}
                      // eslint-disable-next-line @typescript-eslint/no-explicit-any
                      color={STATUS_COLORS[statusId] as any}
                      size="sm"
                    >
                      <Typography level="title-md">Статус: {statusName}</Typography>
                    </Badge>
                    <Chip size="sm" variant="soft">
                      ID: {statusId}
                    </Chip>
                  </Stack>
                </AccordionSummary>

                <AccordionDetails>
                  {!statusReviews.length ? (
                    <Box sx={{ p: 3, textAlign: 'center' }}>
                      <Typography level="body-md" color="neutral">
                        Нет отзывов в этом статусе
                      </Typography>
                    </Box>
                  ) : (
                    <>
                      <Sheet variant="soft" sx={{ borderRadius: 'sm', overflow: 'auto', mb: 2 }}>
                        <Table stickyHeader size="sm">
                          <thead>
                            <tr>
                              <th style={{ padding: '8px', width: '5%' }}>ID</th>
                              <th style={{ padding: '8px', width: '15%' }}>Problem ID</th>
                              <th style={{ padding: '8px' }}>Текст отзыва</th>
                              <th style={{ padding: '8px', width: '15%' }}>Дата создания</th>
                              <th style={{ padding: '8px', width: '10%' }}>Изображение</th>
                              <th style={{ padding: '8px', width: '10%', textAlign: 'right' }}>
                                Действия
                              </th>
                            </tr>
                          </thead>
                          <tbody>
                            {currentReviews.map((review) => (
                              <tr key={review.id}>
                                <td style={{ padding: '8px' }}>
                                  <Typography level="body-sm" fontWeight="md">
                                    {review.id}
                                  </Typography>
                                </td>
                                <td style={{ padding: '8px' }}>
                                  <Chip size="sm" variant="soft">
                                    {translateProblemId(review.problemId)}
                                  </Chip>
                                </td>
                                <td style={{ padding: '8px' }}>
                                  <Typography level="body-sm">
                                    {truncateText(review.text)}
                                  </Typography>
                                </td>
                                <td style={{ padding: '8px' }}>
                                  <Stack direction="row" spacing={1} alignItems="center">
                                    <DateIcon sx={{ fontSize: 14, color: 'neutral.500' }} />
                                    <Typography level="body-sm">
                                      {formatDate(review.creationDate)}
                                    </Typography>
                                  </Stack>
                                </td>
                                <td style={{ padding: '8px' }}>
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
                                <td style={{ padding: '8px', textAlign: 'right' }}>
                                  <IconButton
                                    size="sm"
                                    color="primary"
                                    onClick={() =>
                                      navigate(`/reviews/${review.id}?${searchParams.toString()}`)
                                    }
                                    title="Просмотреть"
                                  >
                                    <ViewIcon />
                                  </IconButton>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </Table>
                      </Sheet>

                      {totalPages > 1 && (
                        <Stack
                          direction="row"
                          spacing={1}
                          justifyContent="center"
                          alignItems="center"
                          sx={{ mt: 1, flexWrap: 'wrap' }}
                        >
                          <IconButton
                            size="sm"
                            variant="outlined"
                            disabled={currentPage === 1}
                            onClick={() => handlePageChange(statusId, 1)}
                            title="Первая"
                          >
                            <FirstPageIcon />
                          </IconButton>
                          <IconButton
                            size="sm"
                            variant="outlined"
                            disabled={currentPage === 1}
                            onClick={() => handlePageChange(statusId, currentPage - 1)}
                            title="Назад"
                          >
                            <ChevronLeftIcon />
                          </IconButton>

                          {renderPageNumbers(totalPages, currentPage, (page) =>
                            handlePageChange(statusId, page)
                          )}

                          <IconButton
                            size="sm"
                            variant="outlined"
                            disabled={currentPage === totalPages}
                            onClick={() => handlePageChange(statusId, currentPage + 1)}
                            title="Вперёд"
                          >
                            <ChevronRightIcon />
                          </IconButton>
                          <IconButton
                            size="sm"
                            variant="outlined"
                            disabled={currentPage === totalPages}
                            onClick={() => handlePageChange(statusId, totalPages)}
                            title="Последняя"
                          >
                            <LastPageIcon />
                          </IconButton>
                        </Stack>
                      )}

                      <Typography
                        level="body-xs"
                        sx={{ mt: 1, textAlign: 'right', color: 'neutral.500' }}
                      >
                        Показано {currentReviews.length} из {statusReviews.length} отзывов •
                        Страница {currentPage} из {totalPages}
                      </Typography>
                    </>
                  )}
                </AccordionDetails>
              </Accordion>
            </Card>
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

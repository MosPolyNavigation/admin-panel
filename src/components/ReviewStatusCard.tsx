import {
  Typography,
  Table,
  Sheet,
  IconButton,
  Button,
  Stack,
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
import { type Review } from '../api';
import { STATUS_COLORS } from '../constants';

const ROWS_PER_PAGE = 5;

interface ReviewStatusCardProps {
  statusId: number;
  statusName: string;
  reviews: Review[];
  currentPage: number;
  totalPages: number;
  isExpanded: boolean;
  onPageChange: (statusId: number, page: number) => void;
  onToggleExpand: (statusId: number) => void;
  onViewReview: (reviewId: number | string) => void;
  formatDate: (dateString: string) => string;
  truncateText: (text: string, maxLength?: number) => string;
  translateProblemId: (id: string) => string;
  searchParams: URLSearchParams;
}

export function ReviewStatusCard({
  statusId,
  statusName,
  reviews,
  currentPage,
  totalPages,
  isExpanded,
  onPageChange,
  onToggleExpand,
  onViewReview,
  formatDate,
  truncateText,
  translateProblemId,
}: ReviewStatusCardProps) {
  const startIndex = (currentPage - 1) * ROWS_PER_PAGE;
  const currentReviews = reviews.slice(startIndex, startIndex + ROWS_PER_PAGE);

  // Вспомогательная функция для рендера пагинации
  const renderPageNumbers = () => {
    if (totalPages <= 5) {
      return Array.from({ length: totalPages }, (_, i) => i + 1).map((i) => (
        <Button
          key={i}
          size="sm"
          variant={currentPage === i ? 'solid' : 'outlined'}
          onClick={() => onPageChange(statusId, i)}
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
        onClick={() => onPageChange(statusId, 1)}
      >
        1
      </Button>,
    ];

    if (currentPage > 3)
      pages.push(
        <Typography key="e1" sx={{ alignSelf: 'center' }}>
          ...
        </Typography>
      );

    const start = Math.max(2, currentPage - 1);
    const end = Math.min(totalPages - 1, currentPage + 1);
    for (let i = start; i <= end; i++) {
      if (i > 1 && i < totalPages) {
        pages.push(
          <Button
            key={i}
            size="sm"
            variant={currentPage === i ? 'solid' : 'outlined'}
            onClick={() => onPageChange(statusId, i)}
          >
            {i}
          </Button>
        );
      }
    }

    if (currentPage < totalPages - 2)
      pages.push(
        <Typography key="e2" sx={{ alignSelf: 'center' }}>
          ...
        </Typography>
      );

    pages.push(
      <Button
        key={totalPages}
        size="sm"
        variant={currentPage === totalPages ? 'solid' : 'outlined'}
        onClick={() => onPageChange(statusId, totalPages)}
      >
        {totalPages}
      </Button>
    );

    return pages;
  };

  return (
    <Card variant="outlined" sx={{ overflow: 'hidden' }}>
      <Accordion expanded={isExpanded} onChange={() => onToggleExpand(statusId)}>
        <AccordionSummary
          indicator={<ExpandMoreIcon />}
          sx={{
            backgroundColor: 'background.level1',
            '&:hover': { backgroundColor: 'background.level2' },
          }}
        >
          <Stack direction="row" spacing={2} alignItems="center" sx={{ flex: 1 }}>
            <Badge
              badgeContent={reviews.length}
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
          {!reviews.length ? (
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
                      <th style={{ padding: '8px', width: '10%', textAlign: 'right' }}>Действия</th>
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
                          <Typography level="body-sm">{truncateText(review.text)}</Typography>
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
                            onClick={() => onViewReview(review.id)}
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
                    onClick={() => onPageChange(statusId, 1)}
                    title="Первая"
                  >
                    <FirstPageIcon />
                  </IconButton>
                  <IconButton
                    size="sm"
                    variant="outlined"
                    disabled={currentPage === 1}
                    onClick={() => onPageChange(statusId, currentPage - 1)}
                    title="Назад"
                  >
                    <ChevronLeftIcon />
                  </IconButton>

                  {renderPageNumbers()}

                  <IconButton
                    size="sm"
                    variant="outlined"
                    disabled={currentPage === totalPages}
                    onClick={() => onPageChange(statusId, currentPage + 1)}
                    title="Вперёд"
                  >
                    <ChevronRightIcon />
                  </IconButton>
                  <IconButton
                    size="sm"
                    variant="outlined"
                    disabled={currentPage === totalPages}
                    onClick={() => onPageChange(statusId, totalPages)}
                    title="Последняя"
                  >
                    <LastPageIcon />
                  </IconButton>
                </Stack>
              )}

              <Typography level="body-xs" sx={{ mt: 1, textAlign: 'right', color: 'neutral.500' }}>
                Показано {currentReviews.length} из {reviews.length} отзывов • Страница{' '}
                {currentPage} из {totalPages}
              </Typography>
            </>
          )}
        </AccordionDetails>
      </Accordion>
    </Card>
  );
}

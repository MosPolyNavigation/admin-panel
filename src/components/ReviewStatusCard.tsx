import {
  Typography,
  Table,
  Sheet,
  IconButton,
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
} from '@mui/icons-material';
import { type Review } from '../api';
import { STATUS_COLORS } from '../constants';
import PaginationControls from './PaginationControls';

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

const ReviewStatusCard = ({
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
}: ReviewStatusCardProps) => {
  const startIndex = (currentPage - 1) * ROWS_PER_PAGE;
  const currentReviews = reviews.slice(startIndex, startIndex + ROWS_PER_PAGE);
  const handlePageChange = (page: number) => {
    onPageChange(statusId, page);
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

              <PaginationControls
                currentPage={currentPage}
                totalPages={totalPages}
                totalItems={reviews.length}
                itemsPerPage={ROWS_PER_PAGE}
                onPageChange={handlePageChange}
                compact
              />
            </>
          )}
        </AccordionDetails>
      </Accordion>
    </Card>
  );
};

export default ReviewStatusCard;

import { IconButton, Button, Stack, Typography } from '@mui/joy';
import {
  FirstPage as FirstPageIcon,
  LastPage as LastPageIcon,
  ChevronLeft as ChevronLeftIcon,
  ChevronRight as ChevronRightIcon,
} from '@mui/icons-material';

export interface PaginationControlsProps {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  itemsPerPage: number;
  onPageChange: (page: number) => void;
  showInfo?: boolean;
  compact?: boolean;
}

const PaginationControls = ({
  currentPage,
  totalPages,
  totalItems,
  itemsPerPage,
  onPageChange,
  showInfo = true,
  compact = false,
}: PaginationControlsProps) => {
  if (totalPages <= 1) return null;

  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = Math.min(startIndex + itemsPerPage, totalItems);

  // Логика рендера номеров страниц с эллипсисом
  const renderPageNumbers = () => {
    // Если страниц мало — показываем все
    if (totalPages <= 5) {
      return Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
        <Button
          key={page}
          size={compact ? 'sm' : 'md'}
          variant={currentPage === page ? 'solid' : 'outlined'}
          onClick={() => onPageChange(page)}
          sx={{ minWidth: compact ? 32 : 40 }}
        >
          {page}
        </Button>
      ));
    }

    const pages: React.ReactNode[] = [
      <Button
        key={1}
        size={compact ? 'sm' : 'md'}
        variant={currentPage === 1 ? 'solid' : 'outlined'}
        onClick={() => onPageChange(1)}
        sx={{ minWidth: compact ? 32 : 40 }}
      >
        1
      </Button>,
    ];

    // Эллипсис в начале
    if (currentPage > 3) {
      pages.push(
        <Typography key="ellipsis-start" sx={{ alignSelf: 'center', mx: 0.5 }}>
          ...
        </Typography>
      );
    }

    // Центральные страницы
    const start = Math.max(2, currentPage - 1);
    const end = Math.min(totalPages - 1, currentPage + 1);
    for (let page = start; page <= end; page++) {
      if (page > 1 && page < totalPages) {
        pages.push(
          <Button
            key={page}
            size={compact ? 'sm' : 'md'}
            variant={currentPage === page ? 'solid' : 'outlined'}
            onClick={() => onPageChange(page)}
            sx={{ minWidth: compact ? 32 : 40 }}
          >
            {page}
          </Button>
        );
      }
    }

    // Эллипсис в конце
    if (currentPage < totalPages - 2) {
      pages.push(
        <Typography key="ellipsis-end" sx={{ alignSelf: 'center', mx: 0.5 }}>
          ...
        </Typography>
      );
    }

    // Последняя страница
    pages.push(
      <Button
        key={totalPages}
        size={compact ? 'sm' : 'md'}
        variant={currentPage === totalPages ? 'solid' : 'outlined'}
        onClick={() => onPageChange(totalPages)}
        sx={{ minWidth: compact ? 32 : 40 }}
      >
        {totalPages}
      </Button>
    );

    return pages;
  };

  return (
    <Stack spacing={1}>
      <Stack
        direction="row"
        spacing={0.5}
        justifyContent="center"
        alignItems="center"
        sx={{ flexWrap: 'wrap' }}
      >
        {/* Первая страница */}
        <IconButton
          size={compact ? 'sm' : 'md'}
          variant="outlined"
          disabled={currentPage === 1}
          onClick={() => onPageChange(1)}
          title="Первая страница"
        >
          <FirstPageIcon />
        </IconButton>

        {/* Назад */}
        <IconButton
          size={compact ? 'sm' : 'md'}
          variant="outlined"
          disabled={currentPage === 1}
          onClick={() => onPageChange(currentPage - 1)}
          title="Назад"
        >
          <ChevronLeftIcon />
        </IconButton>

        {/* Номера страниц */}
        {renderPageNumbers()}

        {/* Вперёд */}
        <IconButton
          size={compact ? 'sm' : 'md'}
          variant="outlined"
          disabled={currentPage === totalPages}
          onClick={() => onPageChange(currentPage + 1)}
          title="Вперёд"
        >
          <ChevronRightIcon />
        </IconButton>

        {/* Последняя страница */}
        <IconButton
          size={compact ? 'sm' : 'md'}
          variant="outlined"
          disabled={currentPage === totalPages}
          onClick={() => onPageChange(totalPages)}
          title="Последняя страница"
        >
          <LastPageIcon />
        </IconButton>
      </Stack>

      {/* Информация о показе */}
      {showInfo && (
        <Typography level="body-xs" sx={{ textAlign: 'right', color: 'neutral.500' }}>
          Показано {endIndex - startIndex} из {totalItems} записей • Страница {currentPage} из{' '}
          {totalPages}
        </Typography>
      )}
    </Stack>
  );
};

export default PaginationControls;

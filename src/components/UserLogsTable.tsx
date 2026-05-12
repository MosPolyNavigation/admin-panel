import { useState, useMemo, useEffect } from 'react';
import { Box, Table, Sheet, Typography, Chip } from '@mui/joy';
import PaginationControls, { type PaginationControlsProps } from './PaginationControls';
import type { UserLog } from '../api/types';

const ITEMS_PER_PAGE = 5;

export interface UserLogsTableProps {
  logs: UserLog[];
}

export const UserLogsTable: React.FC<UserLogsTableProps> = ({ logs }) => {
  const [currentPage, setCurrentPage] = useState(1);

  // Вычисляем общее количество страниц
  const totalPages = useMemo(() => {
    return Math.max(1, Math.ceil(logs.length / ITEMS_PER_PAGE));
  }, [logs.length]);

  // 🔧 Если текущая страница вышла за пределы (после фильтрации/удаления)
  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [totalPages, currentPage]);

  // 🔧 Клиентская пагинация: нарезаем массив логов
  const paginatedLogs = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return logs.slice(start, start + ITEMS_PER_PAGE);
  }, [logs, currentPage]);

  const handlePageChange: PaginationControlsProps['onPageChange'] = (page) => {
    setCurrentPage(page);
  };

  // Форматирование даты
  const formatDate = (iso: string) => {
    return new Date(iso).toLocaleDateString('ru-RU', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (logs.length === 0) {
    return (
      <Typography level="body-md" textColor="neutral.500" sx={{ textAlign: 'center', py: 4 }}>
        Нет записей в журнале
      </Typography>
    );
  }

  return (
    <>
      <Sheet variant="outlined" sx={{ borderRadius: 'sm', overflow: 'hidden' }}>
        <Table
          stickyHeader
          sx={{
            // 🔧 Таблица не сжимается, чтобы текст не вылезал за колонки
            tableLayout: 'fixed',
            width: '100%',
            '& th, & td': {
              // 🔧 Разрешаем перенос текста в ячейках
              whiteSpace: 'normal',
              wordBreak: 'break-word',
              overflowWrap: 'break-word',
              verticalAlign: 'top',
              py: 1.5,
            },
            '& th': {
              backgroundColor: 'var(--joy-palette-background-level1)',
              fontWeight: 'bold',
              fontSize: '0.75rem',
              textTransform: 'uppercase',
              letterSpacing: '0.5px',
            },
          }}
        >
          <thead>
            <tr>
              {/* 🔧 ID: узкая фиксированная колонка */}
              <th style={{ width: 80, padding: '8px' }}>ID</th>

              {/* 🔧 Текст: самая широкая колонка, занимает всё оставшееся место */}
              <th style={{ width: 'auto', padding: '8px' }}>Событие</th>

              {/* 🔧 Дата: фиксированная ширина */}
              <th style={{ width: 160, padding: '8px' }}>Время</th>
            </tr>
          </thead>
          <tbody>
            {paginatedLogs.map((log) => (
              <tr key={log.id}>
                <td style={{ padding: '8px' }}>
                  <Typography level="body-sm" textColor="neutral.500">
                    #{log.id}
                  </Typography>
                </td>

                {/* 🔧 Текст лога: переносится при нехватке места */}
                <td style={{ padding: '8px' }}>
                  <Typography
                    level="body-sm"
                    sx={{
                      // 🔧 Гарантируем перенос длинных слов (если в тексте есть ссылки/хэши)
                      wordBreak: 'break-word',
                      // 🔧 Небольшой отступ для читаемости
                      lineHeight: 1.4,
                    }}
                  >
                    {log.text}
                  </Typography>
                </td>

                <td style={{ padding: '8px' }}>
                  <Chip size="sm" variant="soft" color="neutral">
                    {formatDate(log.createdAt)}
                  </Chip>
                </td>
              </tr>
            ))}
          </tbody>
        </Table>
      </Sheet>

      {/* 🔧 Пагинация, если страниц больше одной */}
      {totalPages > 1 && (
        <Box sx={{ mt: 2, display: 'flex', justifyContent: 'center' }}>
          <PaginationControls
            currentPage={currentPage}
            totalPages={totalPages}
            totalItems={logs.length}
            itemsPerPage={ITEMS_PER_PAGE}
            onPageChange={handlePageChange}
            showInfo={true}
            compact={false}
          />
        </Box>
      )}
    </>
  );
};

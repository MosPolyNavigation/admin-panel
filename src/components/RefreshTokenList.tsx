import { useState, useEffect, useMemo } from 'react';
import { Box, Typography } from '@mui/joy';
import PaginationControls, { type PaginationControlsProps } from '../components/PaginationControls';
import { RefreshTokenCard } from './RefreshTokenCard';
import type { RefreshToken } from '../api/types';

const ITEMS_PER_PAGE = 5;

export interface RefreshTokenListProps {
  tokens: RefreshToken[];
  onSessionRevoked: (jti: string) => void;
}

export const RefreshTokenList: React.FC<RefreshTokenListProps> = ({ tokens, onSessionRevoked }) => {
  const [currentPage, setCurrentPage] = useState(1);

  const totalPages = Math.max(1, Math.ceil(tokens.length / ITEMS_PER_PAGE));

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [totalPages, currentPage]);

  const paginatedTokens = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return tokens.slice(start, start + ITEMS_PER_PAGE);
  }, [tokens, currentPage]);

  const handlePageChange: PaginationControlsProps['onPageChange'] = (page) => {
    setCurrentPage(page);
  };

  if (tokens.length === 0) {
    return (
      <Typography level="body-md" textColor="neutral.500" sx={{ textAlign: 'center', py: 4 }}>
        Нет активных сессий
      </Typography>
    );
  }

  return (
    <>
      {paginatedTokens.map((token) => (
        <RefreshTokenCard key={token.jti} token={token} onSessionRevoked={onSessionRevoked} />
      ))}

      {totalPages > 1 && (
        <Box sx={{ mt: 2, display: 'flex', justifyContent: 'center' }}>
          <PaginationControls
            currentPage={currentPage}
            totalPages={totalPages}
            totalItems={tokens.length}
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

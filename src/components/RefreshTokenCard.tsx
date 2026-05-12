// components/RefreshTokenCard.tsx
import { useState } from 'react';
import { Card, CardContent, Typography, IconButton, Tooltip, LinearProgress } from '@mui/joy';
import { Logout as LogoutIcon } from '@mui/icons-material';
import { revokeRefreshToken } from '../api/auth.ts';
import type { RefreshToken } from '../api/types.ts';

export interface RefreshTokenCardProps {
  token: RefreshToken;
  onSessionRevoked?: (jti: string) => void;
}

const formatDate = (iso: string) => {
  return new Date(iso).toLocaleDateString('ru-RU', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

export const RefreshTokenCard: React.FC<RefreshTokenCardProps> = ({ token, onSessionRevoked }) => {
  const [isRevoking, setIsRevoking] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  const handleRevoke = async () => {
    setIsRevoking(true);
    setLocalError(null);

    try {
      const { ok, error } = await revokeRefreshToken(token.jti);

      if (ok) {
        // Уведомляем родителя, чтобы он обновил состояние (или удалил карточку)
        onSessionRevoked?.(token.jti);
      } else {
        setLocalError(error || 'Не удалось завершить сессию');
      }
    } catch (err) {
      setLocalError(err instanceof Error ? err.message : 'Ошибка сети');
    } finally {
      setIsRevoking(false);
    }
  };

  const statusText = token.revoked ? 'Завершённая сессия.' : 'Активная сессия.';
  const ip = token.userIp || '—';
  const browser = token.browser || '—';
  const exp = formatDate(token.expDate);
  const created = formatDate(token.createdAt);

  return (
    <Card variant="outlined" sx={{ mb: 1, overflow: 'hidden' }}>
      {isRevoking && <LinearProgress />}
      <CardContent
        sx={{ display: 'flex', alignItems: 'flex-start', gap: 2, p: 2, flexDirection: 'row' }}
      >
        {/* Текст: занимает всё доступное место, переносится при нехватке ширины */}
        <Typography
          level="body-md"
          sx={{
            flex: '1 1 auto',
            minWidth: 0,
            whiteSpace: 'normal',
            wordBreak: 'break-word',
            lineHeight: 1.5,
          }}
        >
          {statusText} IP: {ip}, Браузер: {browser}. Истекает {exp}. Создана {created}.
        </Typography>

        {/* Кнопка: прижата к правому краю, не сжимается */}
        <Tooltip title="Завершить сессию" placement="top">
          <IconButton
            color="danger"
            variant={token.revoked ? 'plain' : 'soft'}
            onClick={handleRevoke}
            loading={isRevoking}
            disabled={token.revoked || isRevoking}
            size="sm"
            sx={{ flexShrink: 0 }}
          >
            <LogoutIcon />
          </IconButton>
        </Tooltip>
      </CardContent>

      {/* Локальная ошибка (если родитель не показывает глобальный алерт) */}
      {localError && (
        <Typography level="body-xs" color="danger" sx={{ px: 2, pb: 1 }}>
          {localError}
        </Typography>
      )}
    </Card>
  );
};

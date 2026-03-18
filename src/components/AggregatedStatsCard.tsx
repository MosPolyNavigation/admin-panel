import { Card, Typography, Box, CircularProgress, Alert, Stack, Grid } from '@mui/joy';
import { type AggregatedEndpointStats } from '../api';

interface AggregatedStatsCardProps {
  title: string;
  endpoint: string;
  data: AggregatedEndpointStats | null;
  loading: boolean;
  error: string | null;
}

const AggregatedStatsCard = ({ title, data, loading, error }: AggregatedStatsCardProps) => {
  const formatNumber = (num: number): string => {
    return new Intl.NumberFormat('ru-RU').format(num);
  };

  if (loading) {
    return (
      <Card
        variant="outlined"
        sx={{
          height: '100%',
          minHeight: 250,
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
        }}
      >
        <CircularProgress />
      </Card>
    );
  }

  if (error || !data) {
    return (
      <Card variant="outlined" sx={{ height: '100%', minHeight: 250 }}>
        <Alert color="danger" sx={{ height: '100%', display: 'flex', alignItems: 'center' }}>
          {error || 'Нет данных'}
        </Alert>
      </Card>
    );
  }

  return (
    <Card variant="outlined" sx={{ height: '100%', p: 2 }}>
      <Stack spacing={2} sx={{ height: '100%' }}>
        <Typography level="title-lg">{title}</Typography>

        <Grid container spacing={2} sx={{ flex: 1 }}>
          <Grid xs={6}>
            <Box sx={{ textAlign: 'center', p: 1 }}>
              <Typography level="body-xs" textColor="text.secondary">
                Всего событий
              </Typography>
              <Typography level="h4" fontWeight="bold">
                {formatNumber(data.totalVisits)}
              </Typography>
            </Box>
          </Grid>
          <Grid xs={6}>
            <Box sx={{ textAlign: 'center', p: 1 }}>
              <Typography level="body-xs" textColor="text.secondary">
                Уникальных
              </Typography>
              <Typography level="h4" fontWeight="bold">
                {formatNumber(data.totalUnique)}
              </Typography>
            </Box>
          </Grid>
          <Grid xs={6}>
            <Box sx={{ textAlign: 'center', p: 1 }}>
              <Typography level="body-xs" textColor="text.secondary">
                Всего посетителей
              </Typography>
              <Typography level="h4" fontWeight="bold">
                {formatNumber(data.totalVisitorCount)}
              </Typography>
            </Box>
          </Grid>
          <Grid xs={6}>
            <Box sx={{ textAlign: 'center', p: 1 }}>
              <Typography level="body-xs" textColor="text.secondary">
                Количество записей
              </Typography>
              <Typography level="h4" fontWeight="bold">
                {formatNumber(data.entriesCount)}
              </Typography>
            </Box>
          </Grid>
        </Grid>

        <Box sx={{ borderTop: '1px solid', borderColor: 'divider', pt: 1.5 }}>
          <Typography level="body-sm" fontWeight="bold" textColor="text.secondary" sx={{ mb: 1 }}>
            Средние значения
          </Typography>
          <Grid container spacing={1}>
            <Grid xs={4}>
              <Box sx={{ textAlign: 'center', p: 1 }}>
                <Typography level="body-xs" textColor="text.secondary">
                  Событий
                </Typography>
                <Typography level="body-lg" fontWeight="bold">
                  {formatNumber(data.avgVisits)}
                </Typography>
              </Box>
            </Grid>
            <Grid xs={4}>
              <Box sx={{ textAlign: 'center', p: 1 }}>
                <Typography level="body-xs" textColor="text.secondary">
                  Уникальных
                </Typography>
                <Typography level="body-lg" fontWeight="bold">
                  {formatNumber(data.avgUnique)}
                </Typography>
              </Box>
            </Grid>
            <Grid xs={4}>
              <Box sx={{ textAlign: 'center', p: 1 }}>
                <Typography level="body-xs" textColor="text.secondary">
                  Посетителей
                </Typography>
                <Typography level="body-lg" fontWeight="bold">
                  {formatNumber(data.avgVisitorCount)}
                </Typography>
              </Box>
            </Grid>
          </Grid>
        </Box>
      </Stack>
    </Card>
  );
};

export default AggregatedStatsCard;

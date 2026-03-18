import { Card, Typography, Box, CircularProgress, Alert } from "@mui/joy";
import Stack from "@mui/joy/Stack";
import Grid from "@mui/joy/Grid";
import { type AggregatedEndpointStats } from "../api";

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
            <Card variant="outlined" sx={{ height: '100%', minHeight: 250, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                <CircularProgress />
            </Card>
        );
    }

    if (error || !data) {
        return (
            <Card variant="outlined" sx={{ height: '100%', minHeight: 250 }}>
                <Alert color="danger" sx={{ height: '100%', display: 'flex', alignItems: 'center' }}>
                    {error || "Нет данных"}
                </Alert>
            </Card>
        );
    }

    return (
        <Card variant="outlined" sx={{ height: '100%', p: 2 }}>
            <Stack spacing={2} sx={{ height: '100%' }}>
                <Typography level="title-md" textColor="primary.500" fontWeight="bold">
                    {title}
                </Typography>

                <Grid container spacing={2} sx={{ flex: 1 }}>
                    <Grid xs={6}>
                        <Box sx={{ textAlign: 'center', p: 1 }}>
                            <Typography level="body-xs" textColor="text.secondary">
                                Всего визитов
                            </Typography>
                            <Typography level="h4" fontWeight="bold" textColor="primary.600">
                                {formatNumber(data.TotalVisits)}
                            </Typography>
                        </Box>
                    </Grid>
                    <Grid xs={6}>
                        <Box sx={{ textAlign: 'center', p: 1 }}>
                            <Typography level="body-xs" textColor="text.secondary">
                                Уникальных
                            </Typography>
                            <Typography level="h4" fontWeight="bold" textColor="primary.600">
                                {formatNumber(data.TotalUnique)}
                            </Typography>
                        </Box>
                    </Grid>
                    <Grid xs={6}>
                        <Box sx={{ textAlign: 'center', p: 1 }}>
                            <Typography level="body-xs" textColor="text.secondary">
                                Всего посетителей
                            </Typography>
                            <Typography level="h4" fontWeight="bold" textColor="primary.600">
                                {formatNumber(data.TotalVisitorCount)}
                            </Typography>
                        </Box>
                    </Grid>
                    <Grid xs={6}>
                        <Box sx={{ textAlign: 'center', p: 1 }}>
                            <Typography level="body-xs" textColor="text.secondary">
                                Количество записей
                            </Typography>
                            <Typography level="h4" fontWeight="bold" textColor="primary.600">
                                {formatNumber(data.EntriesCount)}
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
                            <Typography level="body-xs" textColor="text.secondary">
                                Визитов
                            </Typography>
                            <Typography level="body-lg" fontWeight="bold">
                                {formatNumber(data.AvgVisits)}
                            </Typography>
                        </Grid>
                        <Grid xs={4}>
                            <Typography level="body-xs" textColor="text.secondary">
                                Уникальных
                            </Typography>
                            <Typography level="body-lg" fontWeight="bold">
                                {formatNumber(data.AvgUnique)}
                            </Typography>
                        </Grid>
                        <Grid xs={4}>
                            <Typography level="body-xs" textColor="text.secondary">
                                Посетителей
                            </Typography>
                            <Typography level="body-lg" fontWeight="bold">
                                {formatNumber(data.AvgVisitorCount)}
                            </Typography>
                        </Grid>
                    </Grid>
                </Box>
            </Stack>
        </Card>
    );
};

export default AggregatedStatsCard;
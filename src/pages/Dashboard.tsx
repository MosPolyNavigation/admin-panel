import Page from "../components/Page.tsx";
import {Card, Grid} from "@mui/joy";
import LineChartWithFilter from "../components/LineChartWithFilter.tsx";
import DateSelectors from "../components/DateSelectors.tsx";
import {useState, useEffect} from "react";
import dayjs from "../dayjs.ts";
import Stack from "@mui/joy/Stack";
import { useDateSelectors } from "../hooks/useDateSelectors";
import {get_all_stats, get_all_stats_aggregated, type EndpointStatistics, type DateFilterType, type AggregatedEndpointStats} from "../api.ts";
import {useAuth} from "../contexts/AuthContext.tsx";
import { DateIntervalType } from "../components/defs.ts";
import AggregatedStatsCard from "../components/AggregatedStatsCard.tsx";

const Dashboard = () => {
    const { dateInterval, setDateInterval } = useDateSelectors();
    const { token, loading: authLoading } = useAuth();
    
    const startDate = dateInterval.startDate ? dayjs(dateInterval.startDate) : null;
    const endDate = dateInterval.endDate ? dayjs(dateInterval.endDate) : null;
    
    const [chartData, setChartData] = useState<{
        site: EndpointStatistics[];
        auds: EndpointStatistics[];
        ways: EndpointStatistics[];
        plans: EndpointStatistics[];
    } | null>(null);
    
    const [aggregatedData, setAggregatedData] = useState<{
        site: AggregatedEndpointStats | null;
        auds: AggregatedEndpointStats | null;
        ways: AggregatedEndpointStats | null;
        plans: AggregatedEndpointStats | null;
    }>({
        site: null,
        auds: null,
        ways: null,
        plans: null
    });
    
    const [loading, setLoading] = useState<boolean>(true);
    const [aggregatedLoading, setAggregatedLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const [aggregatedError, setAggregatedError] = useState<string | null>(null);

    const getFilterType = (type: DateIntervalType): DateFilterType => {
        switch (type) {
            case DateIntervalType.Year:
                return 'byMonth';
            case DateIntervalType.AllTime:
                return 'byYear';
            case DateIntervalType.Today:
            case DateIntervalType.Yesterday:
            case DateIntervalType.Week:
            case DateIntervalType.Month:
            case DateIntervalType.Custom:
            default:
                return 'byDate';
        }
    };

    useEffect(() => {
        if (!dateInterval.isSetted || authLoading || !token || !dateInterval.startDate || !dateInterval.endDate) {
            setLoading(false);
            setAggregatedLoading(false);
            return;
        }

        const fetchAllData = async () => {
            const requestStartDate = dateInterval.startDate;
            const requestEndDate = dateInterval.endDate;
            const filterType = getFilterType(dateInterval.type);
            
            const isRequestValid = () => 
                dateInterval.startDate === requestStartDate && dateInterval.endDate === requestEndDate;

            try {
                setLoading(true);
                setAggregatedLoading(true);
                setError(null);
                setAggregatedError(null);
                
                const [statsResponse, aggregatedResponse] = await Promise.all([
                    get_all_stats(requestStartDate, requestEndDate, token),
                    get_all_stats_aggregated(filterType, requestStartDate, requestEndDate, token)
                ]);

                if (isRequestValid()) {
                    if (statsResponse.data?.data) {
                        setChartData(statsResponse.data.data);
                    } else {
                        setError("Данные в ответе отсутствуют или имеют неверный формат.");
                    }
                    
                    if (aggregatedResponse.data?.data) {
                        setAggregatedData(aggregatedResponse.data.data);
                    } else {
                        setAggregatedError("Агрегированные данные в ответе отсутствуют или имеют неверный формат.");
                    }
                }
            } catch (err: any) {
                if (isRequestValid()) {
                    setError("Не удалось загрузить данные для графиков.");
                    setAggregatedError("Не удалось загрузить агрегированные данные.");
                }
            } finally {
                if (isRequestValid()) {
                    setLoading(false);
                    setAggregatedLoading(false);
                }
            }
        };

        fetchAllData();
    }, [dateInterval.startDate, dateInterval.endDate, dateInterval.type, dateInterval.isSetted, token, authLoading]);

    return (
        <Page headerText={"Дашборды"}>
            <Stack sx={{gap: 2}}>
                <Card>
                    <DateSelectors 
                        dateInterval={dateInterval} 
                        onDateIntervalChange={setDateInterval}
                    />
                </Card>
                
                <Grid container spacing={2} sx={{flexGrow: 1, justifyContent: "space-evenly"}}>
                    <Grid xs={12} sm={6}>
                        <LineChartWithFilter 
                            start_date={startDate} 
                            end_date={endDate} 
                            headerText="Сайт посетили"
                            endpoint={"site"}
                            data={chartData?.site}
                            loading={loading}
                            error={error}
                        />
                    </Grid>
                    <Grid xs={12} sm={6}>
                        <LineChartWithFilter 
                            start_date={startDate} 
                            end_date={endDate} 
                            headerText="Выбрали аудиторию"
                            endpoint={"auds"}
                            data={chartData?.auds}
                            loading={loading}
                            error={error}
                        />
                    </Grid>
                    <Grid xs={12} sm={6}>
                        <LineChartWithFilter 
                            start_date={startDate} 
                            end_date={endDate} 
                            headerText="Построили маршрут"
                            endpoint={"ways"}
                            data={chartData?.ways}
                            loading={loading}
                            error={error}
                        />
                    </Grid>
                    <Grid xs={12} sm={6}>
                        <LineChartWithFilter 
                            start_date={startDate} 
                            end_date={endDate} 
                            headerText="Сменили план"
                            endpoint={"plans"}
                            data={chartData?.plans}
                            loading={loading}
                            error={error}
                        />
                    </Grid>
                </Grid>
                
                <Grid container spacing={2} sx={{flexGrow: 1, justifyContent: "space-evenly", marginTop: 2}}>
                    <Grid xs={12} sm={6}>
                        <AggregatedStatsCard
                            title="Сайт посетили"
                            endpoint="site"
                            data={aggregatedData.site}
                            loading={aggregatedLoading}
                            error={aggregatedError}
                        />
                    </Grid>
                    <Grid xs={12} sm={6}>
                        <AggregatedStatsCard
                            title="Выбрали аудиторию"
                            endpoint="auds"
                            data={aggregatedData.auds}
                            loading={aggregatedLoading}
                            error={aggregatedError}
                        />
                    </Grid>
                    <Grid xs={12} sm={6}>
                        <AggregatedStatsCard
                            title="Построили маршрут"
                            endpoint="ways"
                            data={aggregatedData.ways}
                            loading={aggregatedLoading}
                            error={aggregatedError}
                        />
                    </Grid>
                    <Grid xs={12} sm={6}>
                        <AggregatedStatsCard
                            title="Сменили план"
                            endpoint="plans"
                            data={aggregatedData.plans}
                            loading={aggregatedLoading}
                            error={aggregatedError}
                        />
                    </Grid>
                </Grid>
            </Stack>
        </Page>
    )
}

export default Dashboard;
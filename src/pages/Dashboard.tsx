import Page from "../components/Page.tsx";
import {Card, Grid} from "@mui/joy";
import LineChartWithFilter from "../components/LineChartWithFilter.tsx";
import DateSelectors from "../components/DateSelectors.tsx";
import {useState, useEffect} from "react";
import dayjs from "../dayjs.ts";
import Stack from "@mui/joy/Stack";
import { useDateSelectors } from "../hooks/useDateSelectors";
import {get_all_stats, type EndpointStatistics} from "../api.ts";
import {useAuth} from "../contexts/AuthContext.tsx";

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
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!dateInterval.isSetted || authLoading || !token || !dateInterval.startDate || !dateInterval.endDate) {
            setLoading(false);
            return;
        }

        const fetchAllData = async () => {
            const requestStartDate = dateInterval.startDate;
            const requestEndDate = dateInterval.endDate;
            const isRequestValid = () => 
                dateInterval.startDate === requestStartDate && dateInterval.endDate === requestEndDate;

            try {
                setLoading(true);
                setError(null);
                
                const response = await get_all_stats(requestStartDate, requestEndDate, token);

                if (isRequestValid()) {
                    if (response.data?.data) {
                        setChartData(response.data.data);
                    } else {
                        setError("Данные в ответе отсутствуют или имеют неверный формат.");
                    }
                }
            } catch (err: any) {
                if (isRequestValid()) {
                    console.error("Ошибка при запросе GraphQL:", err);
                    setError("Не удалось загрузить данные.");
                }
            } finally {
                if (isRequestValid()) {
                    setLoading(false);
                }
            }
        };

        fetchAllData();
    }, [dateInterval.startDate, dateInterval.endDate, dateInterval.isSetted, token, authLoading]);

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
            </Stack>
        </Page>
    )
}

export default Dashboard;
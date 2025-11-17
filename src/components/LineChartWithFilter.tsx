import {Card} from "@mui/joy";
import Typography from "@mui/joy/Typography";
import {LineChart} from "@mui/x-charts";
import {useEffect, useState} from "react";
import dayjs, {Dayjs} from "dayjs";
import {type EndpointStatistics, get_stat} from "../api.ts";
import {useAuth} from "../contexts/AuthContext.tsx";

interface LineChartWithFilterProps {
    headerText: string;
    endpoint: string;
    start_date: Dayjs | null;
    end_date: Dayjs | null;
}

const LineChartWithFilter = ({headerText, endpoint, start_date, end_date}: LineChartWithFilterProps) => {
    const [data, setData] = useState<EndpointStatistics[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const token = useAuth().token!;

    useEffect(() => {
        const fetchData = async () => {
            try {
                if (start_date === null || end_date == null) {
                    return;
                }
                setLoading(true);
                const normalizedStartDate = dayjs(start_date).format('YYYY-MM-DD');
                const normalizedEndDate = dayjs(end_date).format('YYYY-MM-DD');
                const response = await get_stat(endpoint, normalizedStartDate, normalizedEndDate, token);

                if (response.data && response.data.data && response.data.data.endpointStatistics) {
                    setData(response.data.data.endpointStatistics);
                } else {
                    console.error("Некорректная структура ответа GraphQL:", response.data);
                    setError("Данные в ответе отсутствуют или имеют неверный формат.");
                }
            } catch (err) {
                console.error("Ошибка при запросе GraphQL:", err);
                setError("Не удалось загрузить данные.");
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [endpoint, start_date, end_date, token]);

    if (loading) {
        return (
            <Card>
                <Typography level="title-lg">{headerText}</Typography>
                <Typography>Загрузка...</Typography>
            </Card>
        );
    }

    if (error) {
        return (
            <Card>
                <Typography level="title-lg">{headerText}</Typography>
                <Typography color="danger">{error}</Typography>
            </Card>
        );
    }

    return (
        <Card>
            <Typography level="title-lg">{headerText}</Typography>
            <LineChart series={[
                {label: "Всего", dataKey: 'visitorCount'},
                {label: "Уникальных", dataKey: 'uniqueVisitors'}
            ]} xAxis={[
                {dataKey: 'period', scaleType: "band"}
            ]} yAxis={[{width: 50}]} dataset={data} height={250} width={400}/>
        </Card>
    )
}

export default LineChartWithFilter;
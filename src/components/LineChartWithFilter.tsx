import {Card} from "@mui/joy";
import Typography from "@mui/joy/Typography";
import {LineChart} from "@mui/x-charts";
import {useEffect, useState} from "react";
import axios from "axios";
import Stack from "@mui/joy/Stack";
import {AdapterDayjs} from "@mui/x-date-pickers/AdapterDayjs";
import {LocalizationProvider} from "@mui/x-date-pickers/LocalizationProvider";
import {DatePicker} from "@mui/x-date-pickers/DatePicker";
import "dayjs/locale/ru.js";
import dayjs, {Dayjs} from "dayjs";

interface LineChartWithFilterProps {
    headerText: string;
    endpoint: string;
}

interface EndpointStatistics {
    allVisits: number;
    period: string;
    uniqueVisitors: number;
    visitorCount: number;
}

interface GqlResponse {
    data: {
        endpointStatistics: EndpointStatistics[];
    };
}

const LineChartWithFilter = ({headerText, endpoint}: LineChartWithFilterProps) => {
    const [data, setData] = useState<EndpointStatistics[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const [startDate, setStartDate] = useState<Dayjs | null>(dayjs().locale('ru').startOf('week'));
    const [endDate, setEndDate] = useState<Dayjs | null>(dayjs().locale('ru').endOf('week'));

    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);
                const normalizedStartDate = dayjs(startDate).format('YYYY-MM-DD');
                const normalizedEndDate = dayjs(endDate).format('YYYY-MM-DD');
                const response = await axios.post<GqlResponse>(
                    "http://localhost:8080/api/graphql",
                    {
                        query: `{
    endpointStatistics(endpoint: "${endpoint}", endDate: "${normalizedEndDate}", startDate: "${normalizedStartDate}") {
        allVisits
        period
        uniqueVisitors
        visitorCount
    }
}`,
                    },
                    {
                        headers: {
                            "Content-Type": "application/json",
                        },
                    }
                );

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
    }, [endpoint, startDate, endDate]);

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
                <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale="ru">
                    <Stack direction="row">
                        <DatePicker label="Дата начала" value={startDate} onChange={(newValue) => setStartDate(newValue)}/>
                        <DatePicker label="Дата конца" value={endDate} onChange={(newValue) => setEndDate(newValue)}/>
                    </Stack>
                </LocalizationProvider>
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
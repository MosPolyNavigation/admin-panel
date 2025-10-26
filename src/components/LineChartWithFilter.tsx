import {Card} from "@mui/joy";
import Typography from "@mui/joy/Typography";
import {LineChart} from "@mui/x-charts";
import {useEffect, useState} from "react";
import axios from "axios";

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
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const [startDate, _setStartDate] = useState<string>("2025-10-20");
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const [endDate, _setEndDate] = useState<string>("2025-10-26");

    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);
                const response = await axios.post<GqlResponse>(
                    "http://localhost:8080/api/graphql",
                    {
                        query: `{
    endpointStatistics(endpoint: "${endpoint}", endDate: "${endDate}", startDate: "${startDate}") {
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
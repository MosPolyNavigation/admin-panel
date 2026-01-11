import {Card} from "@mui/joy";
import Typography from "@mui/joy/Typography";
import {LineChart} from "@mui/x-charts";
import {Dayjs} from "dayjs";
import {type EndpointStatistics} from "../api.ts";

interface LineChartWithFilterProps {
    headerText: string;
    endpoint: string;
    start_date: Dayjs | null;
    end_date: Dayjs | null;
    data?: EndpointStatistics[];
    loading?: boolean;
    error?: string | null;
}

const LineChartWithFilter = ({headerText, endpoint, start_date, end_date, data = [], loading = false, error = null}: LineChartWithFilterProps) => {

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

    const chartKey = start_date && end_date 
        ? `${endpoint}-${start_date.format('YYYY-MM-DD')}-${end_date.format('YYYY-MM-DD')}`
        : `${endpoint}-default`;

    return (
        <Card>
            <Typography level="title-lg">{headerText}</Typography>
            <LineChart 
                key={chartKey}
                series={[
                    {label: "Всего", dataKey: 'visitorCount'},
                    {label: "Уникальных", dataKey: 'uniqueVisitors'}
                ]} 
                xAxis={[
                    {dataKey: 'period', scaleType: "band"}
                ]} 
                yAxis={[{width: 50}]} 
                dataset={data} 
                height={250} 
                width={400}
            />
        </Card>
    )
}

export default LineChartWithFilter;
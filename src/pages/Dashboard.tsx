import Page from "../components/Page.tsx";
import {Card, Grid} from "@mui/joy";
import LineChartWithFilter from "../components/LineChartWithFilter.tsx";
import DateSelectors from "../components/DateSelectors.tsx";
import {useState} from "react";
import dayjs, {Dayjs} from "dayjs";
import Stack from "@mui/joy/Stack";
import { useDateSelectors } from "../hooks/useDateSelectors"; 

const Dashboard = () => {
    const { dateInterval, setDateInterval } = useDateSelectors();
    
    const initialStart = dayjs().locale('ru').startOf('week');
    const initialEnd = dayjs().locale('ru').endOf('day').isBefore(dayjs().locale('ru').endOf('week'))
        ? dayjs().locale('ru').endOf('day')
        : dayjs().locale('ru').endOf('week');

    const [startDate, setStartDate] = useState<Dayjs | null>(initialStart);
    const [endDate, setEndDate] = useState<Dayjs | null>(initialEnd);

    const handleDateIntervalChange = (interval: any) => {
        setDateInterval(interval);
        setStartDate(dayjs(interval.startDate));
        setEndDate(dayjs(interval.endDate));
    };

    return (
        <Page headerText={"Дашборды"}>
            <Stack sx={{gap: 2}}>
                <Card>
                    <DateSelectors 
                        dateInterval={dateInterval} 
                        onDateIntervalChange={handleDateIntervalChange}
                    />
                </Card>
                <Grid container spacing={2} sx={{flexGrow: 1, justifyContent: "space-evenly"}}>
                    <Grid xs={12} sm={6}>
                        <LineChartWithFilter start_date={startDate} end_date={endDate} headerText="Сайт посетили"
                                             endpoint={"site"}/>
                    </Grid>
                    <Grid xs={12} sm={6}>
                        <LineChartWithFilter start_date={startDate} end_date={endDate} headerText="Выбрали аудиторию"
                                             endpoint={"auds"}/>
                    </Grid>
                    <Grid xs={12} sm={6}>
                        <LineChartWithFilter start_date={startDate} end_date={endDate} headerText="Построили маршрут"
                                             endpoint={"ways"}/>
                    </Grid>
                    <Grid xs={12} sm={6}>
                        <LineChartWithFilter start_date={startDate} end_date={endDate} headerText="Сменили план"
                                             endpoint={"plans"}/>
                    </Grid>
                </Grid>
            </Stack>
        </Page>
    )
}

export default Dashboard;
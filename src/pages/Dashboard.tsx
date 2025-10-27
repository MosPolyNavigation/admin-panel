import Page from "../components/Page.tsx";
import {Card, Grid} from "@mui/joy";
import LineChartWithFilter from "../components/LineChartWithFilter.tsx";
import WeekPicker from "../components/WeekPicker.tsx";
import {useState} from "react";
import dayjs, {Dayjs} from "dayjs";
import Stack from "@mui/joy/Stack";

const Dashboard = () => {
    const initialStart = dayjs().locale('ru').startOf('week');
    const initialEnd = dayjs().locale('ru').endOf('day').isBefore(dayjs().locale('ru').endOf('week'))
        ? dayjs().locale('ru').endOf('day')
        : dayjs().locale('ru').endOf('week');

    const [startDate, setStartDate] = useState<Dayjs | null>(initialStart);
    const [endDate, setEndDate] = useState<Dayjs | null>(initialEnd);

    const weekChange = (start: Dayjs, end: Dayjs) => {
        setStartDate(start);
        setEndDate(end);
    };
    return (
        <Page headerText={"Дашборды"}>
            <Stack sx={{gap: 2}}>
                <Card>
                    <WeekPicker onWeekChange={weekChange}/>
                </Card>
                <Grid container spacing={2} sx={{flexGrow: 1, justifyContent: "space-evenly"}}>
                    <Grid size={{xs: 12, sm: 6}}>
                        <LineChartWithFilter start_date={startDate} end_date={endDate} headerText="Сайт посетили"
                                             endpoint={"site"}/>
                    </Grid>
                    <Grid size={{xs: 12, sm: 6}}>
                        <LineChartWithFilter start_date={startDate} end_date={endDate} headerText="Выбрали аудиторию"
                                             endpoint={"auds"}/>
                    </Grid>
                    <Grid size={{xs: 12, sm: 6}}>
                        <LineChartWithFilter start_date={startDate} end_date={endDate} headerText="Построили маршрут"
                                             endpoint={"ways"}/>
                    </Grid>
                    <Grid size={{xs: 12, sm: 6}}>
                        <LineChartWithFilter start_date={startDate} end_date={endDate} headerText="Сменили план"
                                             endpoint={"plans"}/>
                    </Grid>
                </Grid>
            </Stack>
        </Page>
    )
}

export default Dashboard;

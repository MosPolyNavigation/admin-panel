import Page from "../components/Page.tsx";
import {Grid} from "@mui/joy";
import LineChartWithFilter from "../components/LineChartWithFilter.tsx";

const Dashboard = () => {
    return (
        <Page headerText={"Дашборды"}>
            <Grid container spacing={2} sx={{flexGrow: 1, justifyContent: "space-evenly"}}>
                <Grid size={{ xs: 12, sm: 6 }}>
                    <LineChartWithFilter headerText="Сайт посетили" />
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                    <LineChartWithFilter headerText="Выбрали аудиторию" />
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                    <LineChartWithFilter headerText="Построили маршрут" />
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                    <LineChartWithFilter headerText="Сменили план" />
                </Grid>
            </Grid>
        </Page>
    )
}

export default Dashboard;

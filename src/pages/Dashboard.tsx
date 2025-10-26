import Page from "../components/Page.tsx";
import {Grid} from "@mui/joy";
import LineChartWithFilter from "../components/LineChartWithFilter.tsx";

const Dashboard = () => {
    return (
        <Page headerText={"Дашборды"}>
            <Grid container spacing={2} sx={{flexGrow: 1, justifyContent: "space-evenly"}}>
                <Grid size={6}>
                    <LineChartWithFilter headerText="Сайт посетили" endpoint={"site"} />
                </Grid>
                <Grid size={6}>
                    <LineChartWithFilter headerText="Выбрали аудиторию" endpoint={"auds"}/>
                </Grid>
                <Grid size={6}>
                    <LineChartWithFilter headerText="Построили маршрут" endpoint={"ways"}/>
                </Grid>
                <Grid size={6}>
                    <LineChartWithFilter headerText="Сменили план" endpoint={"plans"}/>
                </Grid>
            </Grid>
        </Page>
    )
}

export default Dashboard;

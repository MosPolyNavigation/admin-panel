import {Card} from "@mui/joy";
import Typography from "@mui/joy/Typography";
import {LineChart} from "@mui/x-charts";

interface LineChartWithFilterProps {
    headerText: string;
}

const dataFixture = {
    "data": {
        "endpointStatistics": [
            {
                "allVisits": 226,
                "period": "2025-10-20",
                "uniqueVisitors": 9,
                "visitorCount": 27
            },
            {
                "allVisits": 41,
                "period": "2025-10-21",
                "uniqueVisitors": 1,
                "visitorCount": 8
            },
            {
                "allVisits": 103,
                "period": "2025-10-22",
                "uniqueVisitors": 1,
                "visitorCount": 10
            },
            {
                "allVisits": 234,
                "period": "2025-10-23",
                "uniqueVisitors": 11,
                "visitorCount": 23
            },
            {
                "allVisits": 143,
                "period": "2025-10-24",
                "uniqueVisitors": 7,
                "visitorCount": 23
            },
            {
                "allVisits": 188,
                "period": "2025-10-25",
                "uniqueVisitors": 4,
                "visitorCount": 9
            },
            {
                "allVisits": 8,
                "period": "2025-10-26",
                "uniqueVisitors": 3,
                "visitorCount": 4
            }
        ]
    }
}

const data = dataFixture.data.endpointStatistics

const LineChartWithFilter = ({headerText}: LineChartWithFilterProps) => {
    return (
        <Card>
            <Typography level="title-lg">{headerText}</Typography>
            <LineChart series={[
                { label: "Всего", dataKey: 'visitorCount'},
                { label: "Уникальных", dataKey: 'uniqueVisitors'}
            ]} xAxis={[
                {dataKey: 'period', scaleType: "band", tickLabelStyle: {angle: -45, textAnchor: "middle"}}
            ]} yAxis={[{width: 50}]} dataset={data} height={250} width={400}/>
        </Card>
    )
}

export default LineChartWithFilter;
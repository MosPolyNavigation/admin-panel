import axios from "axios";

const BASE_URL: string = "http://localhost:8080";

export interface EndpointStatistics {
    allVisits: number;
    period: string;
    uniqueVisitors: number;
    visitorCount: number;
}

export interface GqlResponse {
    data: {
        endpointStatistics: EndpointStatistics[];
    };
}

export const get_stat = async (endpoint: string, normalizedStartDate: string, normalizedEndDate: string, token: string) => {
    return await axios.post<GqlResponse>(
        `${BASE_URL}/api/graphql`,
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
                "Authorization": `Bearer ${token}`
            },
        }
    )
}

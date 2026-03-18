import axios from "axios";
import {BASE_API_URL} from "./config.ts";

export interface EndpointStatistics {
    allVisits: number;
    period: string;
    uniqueVisitors: number;
    visitorCount: number;

    [key: string]: string | number | Date | null | undefined;
}

export interface GqlResponse {
    data: {
        endpointStatistics: EndpointStatistics[];
    };
}

export interface Review {
    id: number | string;
    problemId: string;
    creationDate: string;
    text: string;
    imageName: string | null;
    statusId: number;
}

export interface ReviewStatus {
    id: number;
    name: string;
};

export interface ReviewsGqlResponse {
    data: {
        reviews: Review[];
    };
}

export interface ReviewStatusesGqlResponse {
    data: {
        reviewStatuses: ReviewStatus[];
    };
}
export interface ReviewStatus {
    id: number;
    name: string;
}

export interface SetReviewStatusRespose {
    message: string,
    review_id: number,
    status_id: number,
    status_name: string,
}

export interface BatchGqlResponse {
    data: {
        site: EndpointStatistics[];
        auds: EndpointStatistics[];
        ways: EndpointStatistics[];
        plans: EndpointStatistics[];
    };
}

export interface AggregatedEndpointStats {
    TotalVisits: number;
    TotalUnique: number;
    TotalVisitorCount: number;
    AvgVisits: number;
    AvgUnique: number;
    AvgVisitorCount: number;
    EntriesCount: number;
}

export interface BatchAggregatedGqlResponse {
    data: {
        site: AggregatedEndpointStats;
        auds: AggregatedEndpointStats;
        ways: AggregatedEndpointStats;
        plans: AggregatedEndpointStats;
    } | null;
    errors?: Array<{
        message: string;
        locations?: Array<{ line: number; column: number }>;
        path?: string[];
        extensions?: any;
    }>;
}

export type DateFilterType = 'byDate' | 'byMonth' | 'byYear';

export const get_stat = async (endpoint: string, normalizedStartDate: string, normalizedEndDate: string, token: string) => {
    return await axios.post<GqlResponse>(
        `${BASE_API_URL}/graphql`,
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

export const getReviews = async (token: string): Promise<Review[]> => {
    const response = await axios.post<ReviewsGqlResponse>(
        `${BASE_API_URL}/graphql`,
        {
            query: `{
                reviews {
                    id,
                    problemId,
                    creationDate,
                    text,
                    imageName,
                    statusId
                }
            }`,
        },
        {
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`
            },
        }
    );
    return response.data.data.reviews;
}

export const getReviewStatuses = async (token: string): Promise<ReviewStatus[]> => {
    try {
        const response = await axios.post<ReviewStatusesGqlResponse>(
            `${BASE_API_URL}/graphql`,
            {
                query: `{
                    reviewStatuses {
                        id, name
                    }
                }`,
            },
            {
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
            }
        );
        return response.data.data.reviewStatuses;
    } catch (error) {
        return [];
    }
}

export const getReviewImageUrl = (imageName: string): string => {
    return `${BASE_API_URL}/review/image/${imageName}`;
}

export const setReviewStatus = async (review_id: string, status_id: string, token: string): Promise<SetReviewStatusRespose | null> => {
    try {
        const response = await axios.patch<SetReviewStatusRespose>(
            `${BASE_API_URL}/review/${review_id}/status`,
            `status_id=${status_id}`,
            {
                headers: {
                    "Content-Type": "application/x-www-form-urlencoded",
                    "Authorization": `Bearer ${token}`
                },
            }
        );
        return response.data;
    } catch (error) {
        return null;
    }
}

export const get_all_stats = async (normalizedStartDate: string, normalizedEndDate: string, token: string, signal?: AbortSignal) => {
    return await axios.post<BatchGqlResponse>(
        `${BASE_API_URL}/graphql`,
        {
            query: `{
    site: endpointStatistics(endpoint: "site", endDate: "${normalizedEndDate}", startDate: "${normalizedStartDate}") {
        allVisits
        period
        uniqueVisitors
        visitorCount
    }
    auds: endpointStatistics(endpoint: "auds", endDate: "${normalizedEndDate}", startDate: "${normalizedStartDate}") {
        allVisits
        period
        uniqueVisitors
        visitorCount
    }
    ways: endpointStatistics(endpoint: "ways", endDate: "${normalizedEndDate}", startDate: "${normalizedStartDate}") {
        allVisits
        period
        uniqueVisitors
        visitorCount
    }
    plans: endpointStatistics(endpoint: "plans", endDate: "${normalizedEndDate}", startDate: "${normalizedStartDate}") {
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
            signal,
        }
    );
};

export const get_all_stats_aggregated = async (
    filterType: DateFilterType,
    startDate: string, 
    endDate: string, 
    token: string, 
    signal?: AbortSignal
) => {
    try {
        let filterString = '';
        switch (filterType) {
            case 'byDate':
                filterString = `by_date: {start: "${startDate}", end: "${endDate}"}`;
                break;
            case 'byMonth':
                filterString = `by_month: {start: "${startDate}", end: "${endDate}"}`;
                break;
            case 'byYear':
                filterString = `by_year: {start: "${startDate}", end: "${endDate}"}`;
                break;
        }

        const query = `{
            site: EndpointStatsAvg(endpoint: "site", ${filterString}) {
                TotalVisits
                TotalUnique
                TotalVisitorCount
                AvgVisits
                AvgUnique
                AvgVisitorCount
                EntriesCount
            }
            auds: EndpointStatsAvg(endpoint: "auds", ${filterString}) {
                TotalVisits
                TotalUnique
                TotalVisitorCount
                AvgVisits
                AvgUnique
                AvgVisitorCount
                EntriesCount
            }
            ways: EndpointStatsAvg(endpoint: "ways", ${filterString}) {
                TotalVisits
                TotalUnique
                TotalVisitorCount
                AvgVisits
                AvgUnique
                AvgVisitorCount
                EntriesCount
            }
            plans: EndpointStatsAvg(endpoint: "plans", ${filterString}) {
                TotalVisits
                TotalUnique
                TotalVisitorCount
                AvgVisits
                AvgUnique
                AvgVisitorCount
                EntriesCount
            }
        }`;

        const response = await axios.post<BatchAggregatedGqlResponse>(
            `${BASE_API_URL}/graphql`,
            { query },
            {
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
                signal,
            }
        );
        
        return response;
    } catch (error) {
        throw error;
    }
};
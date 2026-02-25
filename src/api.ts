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
        console.error('Ошибка загрузки статусов:', error);
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
        return response.data
    }
    catch (error) {
        console.error('Ошибка загрузки статусов:', error);
        return null;
    }
}


export const getReviewsBatch = async (token: string, signal?: AbortSignal) => {
    const query = `{
        status1: reviews(status_id: 1) {
            id
            problemId
            creationDate
            text
            status_id
            imageName
        }
        status2: reviews(status_id: 2) {
            id
            problemId
            creationDate
            text
            status_id
            imageName
        }
        status3: reviews(status_id: 3) {
            id
            problemId
            creationDate
            text
            status_id
            imageName
        }
        status4: reviews(status_id: 4) {
            id
            problemId
            creationDate
            text
            status_id
            imageName
        }
        status5: reviews(status_id: 5) {
            id
            problemId
            creationDate
            text
            status_id
            imageName
        }
        status6: reviews(status_id: 6) {
            id
            problemId
            creationDate
            text
            status_id
            imageName
        }
        status7: reviews(status_id: 7) {
            id
            problemId
            creationDate
            text
            status_id
            imageName
        }
    }`;

    const response = await axios.post<{
        data: {
            status1: Review[];
            status2: Review[];
            status3: Review[];
            status4: Review[];
            status5: Review[];
            status6: Review[];
            status7: Review[];
        }
    }>(
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

    return response.data.data;
};

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
    )
}

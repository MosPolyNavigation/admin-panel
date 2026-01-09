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
}

export interface ReviewsGqlResponse {
    data: {
        reviews: Review[];
    };
}

export interface ReviewStatus {
    id: number;
    name: string;
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
                    imageName
                }
            }`,
        },
        // status { id, name }
        {
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`
            },
        }
    );
    return response.data.data.reviews;
}

export const getReviewStatuses = async (reviewId: string, token: string): Promise<ReviewStatus[]> => {
    try {
        const response = await axios.get<ReviewStatus[]>(
            `${BASE_API_URL}/review/statuses`,
            {
                headers: {
                    "Authorization": `Bearer ${token}`
                },
            }
        );
        return response.data;
    } catch (error) {
        console.error('Ошибка загрузки статусов:', error);
        return [];
    }
}

export const getReviewImageUrl = (imageName: string): string => {
    return `${BASE_API_URL}/review/image/${imageName}`;
}

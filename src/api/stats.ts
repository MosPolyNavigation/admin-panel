import { graphqlClient } from './client.ts';
import type {
  GqlResponse,
  EndpointStatistics,
  AggregatedEndpointStats,
  DateFilterType,
} from './types.ts';
import axios from 'axios';

export const getStat = async (
  endpoint: string,
  normalizedStartDate: string,
  normalizedEndDate: string,
  signal?: AbortSignal
) => {
  const response = await graphqlClient.post(
    `{ endpointStatistics(endpoint: "${endpoint}", endDate: "${normalizedEndDate}", startDate: "${normalizedStartDate}") { allVisits period uniqueVisitors visitorCount } }`,
    undefined,
    {
      signal,
    }
  );

  return response;
};

export const getAllStats = async (
  filterType: DateFilterType,
  startDate: string,
  endDate: string,
  signal?: AbortSignal
) => {
  try {
    const filterString = `${filterType}: {start: "${startDate}", end: "${endDate}"}`;
    const query = `{
      site: endpointStatistics(endpoint: "site", ${filterString}) {
        allVisits period uniqueVisitors visitorCount
      }
      auds: endpointStatistics(endpoint: "auds", ${filterString}) {
        allVisits period uniqueVisitors visitorCount
      }
      ways: endpointStatistics(endpoint: "ways", ${filterString}) {
        allVisits period uniqueVisitors visitorCount
      }
      plans: endpointStatistics(endpoint: "plans", ${filterString}) {
        allVisits period uniqueVisitors visitorCount
      }
    }`;

    const response = await graphqlClient.post<
      GqlResponse<{
        site: EndpointStatistics[];
        auds: EndpointStatistics[];
        ways: EndpointStatistics[];
        plans: EndpointStatistics[];
      }>
    >(query, undefined, {
      signal,
    });

    return response;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      console.error('Ошибка API:', {
        status: error.response?.status,
        data: error.response?.data,
        headers: error.response?.headers,
      });
    }
    throw error;
  }
};

export const getAllStatsAggregated = async (
  filterType: DateFilterType,
  startDate: string,
  endDate: string,
  signal?: AbortSignal
) => {
  const filterString = `${filterType}: {start: "${startDate}", end: "${endDate}"}`;
  const query = `{ 
    site: endpointStatisticsAvg(endpoint: "site", ${filterString}) { 
      totalVisits totalUnique totalVisitorCount avgVisits avgUnique avgVisitorCount entriesCount 
    } 
    auds: endpointStatisticsAvg(endpoint: "auds", ${filterString}) { 
      totalVisits totalUnique totalVisitorCount avgVisits avgUnique avgVisitorCount entriesCount 
    } 
    ways: endpointStatisticsAvg(endpoint: "ways", ${filterString}) { 
      totalVisits totalUnique totalVisitorCount avgVisits avgUnique avgVisitorCount entriesCount 
    } 
    plans: endpointStatisticsAvg(endpoint: "plans", ${filterString}) { 
      totalVisits totalUnique totalVisitorCount avgVisits avgUnique avgVisitorCount entriesCount 
    } 
  }`;

  const response = await graphqlClient.post<
    GqlResponse<{
      site: AggregatedEndpointStats;
      auds: AggregatedEndpointStats;
      ways: AggregatedEndpointStats;
      plans: AggregatedEndpointStats;
    }>
  >(query, undefined, { signal });

  return response;
};

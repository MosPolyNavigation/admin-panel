import { graphqlClient } from './client.ts';
import type {
  GqlResponse,
  EndpointStatistics,
  AggregatedEndpointStats,
  DateFilterType,
} from './types.ts';

const STAT_FIELDS = 'allVisits period uniqueVisitors visitorCount';
const AGG_STAT_FIELDS =
  'totalVisits totalUnique totalVisitorCount avgVisits avgUnique avgVisitorCount entriesCount';

function resolveFilterArg(type: string): 'byDate' | 'byMonth' | 'byYear' {
  const allowed: readonly string[] = ['byDate', 'byMonth', 'byYear'];

  if (!allowed.includes(type)) {
    throw new Error(
      `Неподдерживаемый тип фильтра: "${type}". Ожидается: byDate, byMonth или byYear`
    );
  }

  return type as 'byDate' | 'byMonth' | 'byYear';
}

function validateDate(date: string, paramName: string): void {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    throw new Error(`Неверный формат ${paramName}: "${date}". Ожидается ISO-формат YYYY-MM-DD`);
  }
}

export const getStat = async (
  endpoint: string,
  filterType: DateFilterType = 'byDate',
  startDate: string,
  endDate: string,
  signal?: AbortSignal
): Promise<{ data: EndpointStatistics[] | null; error: string | null }> => {
  validateDate(startDate, 'startDate');
  validateDate(endDate, 'endDate');

  const fType = resolveFilterArg(filterType);
  const query = `{ 
    endpointStatistics(
      endpoint: ${JSON.stringify(endpoint)}, 
      ${fType}: {start: ${JSON.stringify(startDate)}, end: ${JSON.stringify(endDate)}}
    ) { ${STAT_FIELDS} } 
  }`;

  try {
    const response = await graphqlClient.post<
      GqlResponse<{ endpointStatistics: EndpointStatistics[] }>
    >(query, undefined, { signal });

    if (response.data.errors?.length) {
      return { data: null, error: response.data.errors.map((e) => e.message).join('; ') };
    }
    return { data: response.data.data?.endpointStatistics ?? [], error: null };
  } catch (err) {
    return { data: null, error: err instanceof Error ? err.message : 'Ошибка запроса статистики' };
  }
};

export const getAllStats = async (
  filterType: DateFilterType,
  startDate: string,
  endDate: string,
  signal?: AbortSignal
): Promise<{
  data: {
    site: EndpointStatistics[];
    auds: EndpointStatistics[];
    ways: EndpointStatistics[];
    plans: EndpointStatistics[];
  } | null;
  error: string | null;
}> => {
  validateDate(startDate, 'startDate');
  validateDate(endDate, 'endDate');

  const fType = resolveFilterArg(filterType);
  const dateArg = `${fType}: {start: ${JSON.stringify(startDate)}, end: ${JSON.stringify(endDate)}}`;

  const query = `{
    site: endpointStatistics(endpoint: "site", ${dateArg}) { ${STAT_FIELDS} }
    auds: endpointStatistics(endpoint: "auds", ${dateArg}) { ${STAT_FIELDS} }
    ways: endpointStatistics(endpoint: "ways", ${dateArg}) { ${STAT_FIELDS} }
    plans: endpointStatistics(endpoint: "plans", ${dateArg}) { ${STAT_FIELDS} }
  }`;

  try {
    const response = await graphqlClient.post<
      GqlResponse<{
        site: EndpointStatistics[];
        auds: EndpointStatistics[];
        ways: EndpointStatistics[];
        plans: EndpointStatistics[];
      }>
    >(query, undefined, { signal });

    if (response.data.errors?.length) {
      return { data: null, error: response.data.errors.map((e) => e.message).join('; ') };
    }
    return { data: response.data.data ?? null, error: null };
  } catch (err) {
    return { data: null, error: err instanceof Error ? err.message : 'Ошибка запроса статистики' };
  }
};

export const getAllStatsAggregated = async (
  filterType: DateFilterType,
  startDate: string,
  endDate: string,
  signal?: AbortSignal
): Promise<{
  data: {
    site: AggregatedEndpointStats;
    auds: AggregatedEndpointStats;
    ways: AggregatedEndpointStats;
    plans: AggregatedEndpointStats;
  } | null;
  error: string | null;
}> => {
  validateDate(startDate, 'startDate');
  validateDate(endDate, 'endDate');

  const fType = resolveFilterArg(filterType);
  const dateArg = `${fType}: {start: ${JSON.stringify(startDate)}, end: ${JSON.stringify(endDate)}}`;

  const query = `{
    site: endpointStatisticsAvg(endpoint: "site", ${dateArg}) { ${AGG_STAT_FIELDS} }
    auds: endpointStatisticsAvg(endpoint: "auds", ${dateArg}) { ${AGG_STAT_FIELDS} }
    ways: endpointStatisticsAvg(endpoint: "ways", ${dateArg}) { ${AGG_STAT_FIELDS} }
    plans: endpointStatisticsAvg(endpoint: "plans", ${dateArg}) { ${AGG_STAT_FIELDS} }
  }`;

  try {
    const response = await graphqlClient.post<
      GqlResponse<{
        site: AggregatedEndpointStats;
        auds: AggregatedEndpointStats;
        ways: AggregatedEndpointStats;
        plans: AggregatedEndpointStats;
      }>
    >(query, undefined, { signal });

    if (response.data.errors?.length) {
      return { data: null, error: response.data.errors.map((e) => e.message).join('; ') };
    }
    return { data: response.data.data ?? null, error: null };
  } catch (err) {
    return {
      data: null,
      error: err instanceof Error ? err.message : 'Ошибка запроса агрегированной статистики',
    };
  }
};

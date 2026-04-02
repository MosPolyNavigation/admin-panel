import { graphqlClient } from './client.ts';
import type {
  PaginationInfo,
  GqlResponse,
  NavAuditory,
  NavLocation,
  NavLocationCreateInput,
  NavLocationUpdateInput,
  NavType,
  NavCampus,
  NavCampusConnection,
  NavCampusCreateInput,
  NavCampusUpdateInput,
} from './types.ts';

const LOCATION_FIELDS = 'id idSys name short ready metro address comments crossings';

function authHeaders(token: string, signal?: AbortSignal) {
  return {
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    signal,
  };
}

export function gqlErrorMessage(body: GqlResponse<unknown> | undefined): string | null {
  if (!body?.errors?.length) return null;
  return body.errors.map((e) => e.message).join('; ');
}

export const getNavLocations = async (
  token: string,
  filters?: { id?: number; idSys?: string },
  signal?: AbortSignal
): Promise<{ locations: NavLocation[]; error: string | null }> => {
  const parts: string[] = [];
  if (filters?.id !== undefined && filters.id !== null && !Number.isNaN(Number(filters.id))) {
    parts.push(`id: ${Number(filters.id)}`);
  }
  if (filters?.idSys !== undefined && filters.idSys.trim() !== '') {
    parts.push(`idSys: ${JSON.stringify(filters.idSys.trim())}`);
  }

  // Исправление: используем filter Input Object и nodes
  const args = parts.length ? `(filter: {${parts.join(', ')}})` : '';
  const query = `{ navLocations${args} { nodes { ${LOCATION_FIELDS} } } }`;

  const response = await graphqlClient.post<
    GqlResponse<{ navLocations: { nodes: NavLocation[] } }>
  >('/graphql', { query }, authHeaders(token, signal));

  const err = gqlErrorMessage(response.data);
  if (err) return { locations: [], error: err };
  return { locations: response.data.data?.navLocations?.nodes ?? [], error: null };
};

export const NAV_CROSSING_TYPE_ID_FALLBACK = 16;

export const getNavAuditoriesByTypeId = async (
  token: string,
  typeId: number,
  limit: number = 50,
  signal?: AbortSignal
): Promise<{ items: NavAuditory[]; error: string | null }> => {
  const query = `{ navAuditories(filter: {typeId: ${typeId}}, pagination: {limit: ${limit}}) { nodes { id idSys name typeId } } }`;
  const response = await graphqlClient.post<
    GqlResponse<{ navAuditories: { nodes: NavAuditory[] } }>
  >('/graphql', { query }, authHeaders(token, signal));
  const err = gqlErrorMessage(response.data);
  if (err) return { items: [], error: err };
  return { items: response.data.data?.navAuditories?.nodes ?? [], error: null };
};

export const getNavTypes = async (
  token: string,
  limit: number = 50,
  signal?: AbortSignal
): Promise<{ items: NavType[]; error: string | null }> => {
  const query = `{ navTypes(pagination: {limit: ${limit}}) { nodes { id name } } }`;
  const response = await graphqlClient.post<GqlResponse<{ navTypes: { nodes: NavType[] } }>>(
    '/graphql',
    { query },
    authHeaders(token, signal)
  );
  const err = gqlErrorMessage(response.data);
  if (err) return { items: [], error: err };
  return { items: response.data.data?.navTypes?.nodes ?? [], error: null };
};

export const updateNavLocationsBatch = async (
  token: string,
  updates: Array<{ id: number; data: NavLocationUpdateInput }>,
  signal?: AbortSignal
): Promise<{ locations: NavLocation[]; error: string | null }> => {
  if (updates.length === 0) {
    return { locations: [], error: null };
  }

  const variableDefinitions: string[] = [];
  const variableValues: Record<string, unknown> = {};
  const mutationFields: string[] = [];

  updates.forEach((u, i) => {
    const idVar = `id${i}`;
    const dataVar = `data${i}`;
    variableDefinitions.push(`$${idVar}: Int!`, `$${dataVar}: NavLocationUpdateInput!`);
    variableValues[idVar] = u.id;
    variableValues[dataVar] = buildUpdateVariablePayload(u.data);
    mutationFields.push(
      `loc${i}: updateNavLocation(id: $${idVar}, data: $${dataVar}) { ${LOCATION_FIELDS} }`
    );
  });

  const mutation = `mutation(${variableDefinitions.join(', ')}) { ${mutationFields.join(' ')} }`;

  const response = await graphqlClient.post<GqlResponse<Record<string, NavLocation | null>>>(
    '/graphql',
    { query: mutation, variables: variableValues },
    authHeaders(token, signal)
  );

  const err = gqlErrorMessage(response.data);
  if (err) return { locations: [], error: err };

  const data = response.data.data;
  if (!data) return { locations: [], error: 'Пустой ответ' };

  const locations: NavLocation[] = [];
  updates.forEach((_, i) => {
    const loc = data[`loc${i}` as keyof typeof data] as NavLocation | null | undefined;
    if (loc) locations.push(loc);
  });

  return { locations, error: null };
};

function buildUpdateVariablePayload(data: NavLocationUpdateInput): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  if (data.idSys !== undefined) out.idSys = data.idSys;
  if (data.name !== undefined) out.name = data.name;
  if (data.short !== undefined) out.short = data.short;
  if (data.ready !== undefined) out.ready = data.ready;
  if (data.address !== undefined) out.address = data.address;
  if (data.metro !== undefined) out.metro = data.metro;
  if (data.comments !== undefined) out.comments = data.comments;
  if (data.crossings !== undefined) out.crossings = data.crossings;
  return out;
}

export const createNavLocation = async (
  token: string,
  data: NavLocationCreateInput,
  signal?: AbortSignal
): Promise<{ location: NavLocation | null; error: string | null }> => {
  const vars = {
    idSys: data.idSys,
    name: data.name,
    short: data.short,
    ready: data.ready,
    address: data.address,
    metro: data.metro,
    comments: data.comments ?? null,
    crossings: data.crossings ?? '[]',
  };

  const mutation = `
    mutation($data: NavLocationInput!) {
      createNavLocation(data: $data) { ${LOCATION_FIELDS} }
    }
  `;

  const response = await graphqlClient.post<GqlResponse<{ createNavLocation: NavLocation }>>(
    '/graphql',
    { query: mutation, variables: { data: vars } },
    authHeaders(token, signal)
  );

  const err = gqlErrorMessage(response.data);
  if (err) return { location: null, error: err };
  return { location: response.data.data?.createNavLocation ?? null, error: null };
};

export const deleteNavLocation = async (
  token: string,
  id: number,
  signal?: AbortSignal
): Promise<{ ok: boolean; error: string | null }> => {
  const mutation = `mutation { deleteNavLocation(id: ${id}) }`;
  const response = await graphqlClient.post<GqlResponse<{ deleteNavLocation: boolean }>>(
    '/graphql',
    { query: mutation },
    authHeaders(token, signal)
  );
  const err = gqlErrorMessage(response.data);
  if (err) return { ok: false, error: err };
  return { ok: Boolean(response.data.data?.deleteNavLocation), error: null };
};

const CAMPUS_FIELDS = 'id idSys locId name ready stairGroups comments';

export const getNavCampuses = async (
  token: string,
  filters?: { id?: number; idSys?: string; locId?: number; name?: string; ready?: boolean },
  pagination?: { limit?: number; offset?: number },
  signal?: AbortSignal
): Promise<{
  campuses: NavCampus[];
  pagination?: PaginationInfo;
  error: string | null;
}> => {
  const filterParts: string[] = [];
  if (filters?.id !== undefined && filters.id !== null) {
    filterParts.push(`id: ${Number(filters.id)}`);
  }
  if (filters?.idSys !== undefined && filters.idSys?.trim() !== '') {
    filterParts.push(`idSys: ${JSON.stringify(filters.idSys.trim())}`);
  }
  if (filters?.locId !== undefined && filters.locId !== null) {
    filterParts.push(`locId: ${Number(filters.locId)}`);
  }
  if (filters?.name !== undefined && filters.name?.trim() !== '') {
    filterParts.push(`name: ${JSON.stringify(filters.name.trim())}`);
  }
  if (filters?.ready !== undefined) {
    filterParts.push(`ready: ${filters.ready}`);
  }

  const args: string[] = [];
  if (filterParts.length) {
    args.push(`filter: {${filterParts.join(', ')}}`);
  }
  if (pagination?.limit !== undefined || pagination?.offset !== undefined) {
    const pParts: string[] = [];
    if (pagination?.limit !== undefined) pParts.push(`limit: ${pagination.limit}`);
    if (pagination?.offset !== undefined) pParts.push(`offset: ${pagination.offset}`);
    args.push(`pagination: {${pParts.join(', ')}}`);
  }
  const argsStr = args.length ? `(${args.join(', ')})` : '';

  const query = `{ navCampuses${argsStr} { 
    nodes { ${CAMPUS_FIELDS} } 
    pageInfo { hasPreviousPage hasNextPage startCursor endCursor }
    paginationInfo { totalCount currentPage totalPages }
  } }`;

  const response = await graphqlClient.post<GqlResponse<{ navCampuses: NavCampusConnection }>>(
    '/graphql',
    { query },
    {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      signal,
    }
  );

  const err = response.data?.errors?.length
    ? response.data.errors.map((e: { message: string }) => e.message).join('; ')
    : null;

  if (err) return { campuses: [], error: err };

  const data = response.data.data?.navCampuses;
  return {
    campuses: data?.nodes ?? [],
    pagination: data?.paginationInfo,
    error: null,
  };
};

export const updateNavCampusesBatch = async (
  token: string,
  updates: Array<{ id: number; data: NavCampusUpdateInput }>,
  signal?: AbortSignal
): Promise<{ campuses: NavCampus[]; error: string | null }> => {
  if (updates.length === 0) {
    return { campuses: [], error: null };
  }

  const variableDefinitions: string[] = [];
  const variableValues: Record<string, unknown> = {};
  const mutationFields: string[] = [];

  updates.forEach((u, i) => {
    const idVar = `id${i}`;
    const dataVar = `data${i}`;
    variableDefinitions.push(`$${idVar}: Int!`, `$${dataVar}: NavCampusUpdateInput!`);
    variableValues[idVar] = u.id;
    variableValues[dataVar] = buildCampusUpdateVariablePayload(u.data);
    mutationFields.push(
      `campus${i}: updateNavCampus(id: $${idVar}, data: $${dataVar}) { ${CAMPUS_FIELDS} }`
    );
  });

  const mutation = `mutation(${variableDefinitions.join(', ')}) { ${mutationFields.join(' ')} }`;

  const response = await graphqlClient.post<GqlResponse<Record<string, NavCampus | null>>>(
    '/graphql',
    { query: mutation, variables: variableValues },
    authHeaders(token, signal)
  );

  const err = gqlErrorMessage(response.data);
  if (err) return { campuses: [], error: err };

  const data = response.data.data;
  if (!data) return { campuses: [], error: 'Пустой ответ' };

  const campuses: NavCampus[] = [];
  updates.forEach((_, i) => {
    const campus = data[`campus${i}` as keyof typeof data] as NavCampus | null | undefined;
    if (campus) campuses.push(campus);
  });

  return { campuses, error: null };
};

function buildCampusUpdateVariablePayload(data: NavCampusUpdateInput): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  if (data.idSys !== undefined) out.idSys = data.idSys;
  if (data.locId !== undefined) out.locId = data.locId;
  if (data.name !== undefined) out.name = data.name;
  if (data.ready !== undefined) out.ready = data.ready;
  if (data.stairGroups !== undefined) out.stairGroups = data.stairGroups;
  if (data.comments !== undefined) out.comments = data.comments;
  return out;
}

export const createNavCampus = async (
  token: string,
  data: NavCampusCreateInput,
  signal?: AbortSignal
): Promise<{ campus: NavCampus | null; error: string | null }> => {
  const vars = {
    idSys: data.idSys,
    locId: data.locId,
    name: data.name,
    ready: data.ready,
    stairGroups: data.stairGroups ?? null,
    comments: data.comments ?? null,
  };

  const mutation = `
    mutation($data: NavCampusInput!) {
      createNavCampus(data: $data) { ${CAMPUS_FIELDS} }
    }
  `;

  const response = await graphqlClient.post<GqlResponse<{ createNavCampus: NavCampus }>>(
    '/graphql',
    { query: mutation, variables: { data: vars } },
    authHeaders(token, signal)
  );

  const err = gqlErrorMessage(response.data);
  if (err) return { campus: null, error: err };
  return { campus: response.data.data?.createNavCampus ?? null, error: null };
};

export const deleteNavCampus = async (
  token: string,
  id: number,
  signal?: AbortSignal
): Promise<{ ok: boolean; error: string | null }> => {
  const mutation = `mutation { deleteNavCampus(id: ${id}) }`;
  const response = await graphqlClient.post<GqlResponse<{ deleteNavCampus: boolean }>>(
    '/graphql',
    { query: mutation },
    authHeaders(token, signal)
  );
  const err = gqlErrorMessage(response.data);
  if (err) return { ok: false, error: err };
  return { ok: Boolean(response.data.data?.deleteNavCampus), error: null };
};

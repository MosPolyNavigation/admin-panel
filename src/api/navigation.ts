import { graphqlClient } from './client.ts';
import type {
  GqlResponse,
  NavAuditory,
  NavLocation,
  NavLocationCreateInput,
  NavLocationUpdateInput,
  NavType,
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
  signal?: AbortSignal
): Promise<{ items: NavAuditory[]; error: string | null }> => {
  const query = `{ navAuditories(filter: {typeId: ${typeId}}) { nodes { id idSys name typeId } } }`;
  const response = await graphqlClient.post<
    GqlResponse<{ navAuditories: { nodes: NavAuditory[] } }>
  >('/graphql', { query }, authHeaders(token, signal));
  const err = gqlErrorMessage(response.data);
  if (err) return { items: [], error: err };
  return { items: response.data.data?.navAuditories?.nodes ?? [], error: null };
};

export const getNavTypes = async (
  token: string,
  signal?: AbortSignal
): Promise<{ items: NavType[]; error: string | null }> => {
  const query = `{ navTypes { nodes { id name } } }`;
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

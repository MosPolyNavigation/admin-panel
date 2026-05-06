import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Card,
  Chip,
  Divider,
  FormControl,
  FormLabel,
  IconButton,
  Input,
  LinearProgress,
  Modal,
  ModalClose,
  ModalDialog,
  Option,
  Select,
  Sheet,
  Stack,
  Switch,
  Table,
  Textarea,
  Typography,
} from '@mui/joy';
import {
  Add,
  AddComment,
  AltRoute,
  Comment,
  Delete as DeleteIcon,
  FilterList as FilterIcon,
  Map as MapIcon,
  Refresh as RefreshIcon,
} from '@mui/icons-material';
import Page from '../components/Page.tsx';
import { RequirePermission } from '../components/RequirePermission.tsx';
import { useAuth } from '../hooks/useAuth.ts';
import {
  createNavLocation,
  deleteNavLocation,
  getNavAuditoriesByTypeId,
  getNavLocations,
  getNavTypes,
  NAV_CROSSING_TYPE_ID_FALLBACK,
  updateNavLocationsBatch,
  type NavAuditory,
  type NavLocation,
  type NavLocationCreateInput,
  type NavLocationUpdateInput,
} from '../api';

export type CrossingTriple = [string, string, number];

function parseCrossingsTriples(raw: string | null | undefined): CrossingTriple[] {
  if (raw == null || raw === '') return [];
  try {
    const v = JSON.parse(raw) as unknown;
    if (!Array.isArray(v)) return [];
    const out: CrossingTriple[] = [];
    for (const item of v) {
      if (!Array.isArray(item) || item.length < 3) continue;
      const a = String(item[0]);
      const b = String(item[1]);
      const n = typeof item[2] === 'number' ? item[2] : parseFloat(String(item[2]));
      if (!Number.isFinite(n)) continue;
      out.push([a, b, n]);
    }
    return out;
  } catch {
    return [];
  }
}

function triplesToJson(triples: CrossingTriple[]): string {
  return JSON.stringify(triples);
}

interface EditableRow {
  key: string;
  serverId: number | null;
  idSys: string;
  name: string;
  short: string;
  ready: boolean;
  metro: string;
  address: string;
  comments: string | null;
  crossingsJson: string;
  isNew?: boolean;
}

function fromApi(loc: NavLocation): EditableRow {
  const crossings =
    loc.crossings != null && String(loc.crossings).trim() !== '' ? String(loc.crossings) : '[]';
  return {
    key: `s-${loc.id}`,
    serverId: loc.id,
    idSys: loc.idSys,
    name: loc.name,
    short: loc.short,
    ready: loc.ready,
    metro: loc.metro,
    address: loc.address,
    comments: loc.comments,
    crossingsJson: crossings,
    isNew: false,
  };
}

function emptyNewRow(key: string): EditableRow {
  return {
    key,
    serverId: null,
    idSys: '',
    name: '',
    short: '',
    ready: false,
    metro: '',
    address: '',
    comments: null,
    crossingsJson: '[]',
    isNew: true,
  };
}

function cloneRow(r: EditableRow): EditableRow {
  return { ...r, isNew: false };
}

function diffRow(init: EditableRow, cur: EditableRow): NavLocationUpdateInput | null {
  const d: NavLocationUpdateInput = {};
  if (init.idSys !== cur.idSys) d.idSys = cur.idSys;
  if (init.name !== cur.name) d.name = cur.name;
  if (init.short !== cur.short) d.short = cur.short;
  if (init.ready !== cur.ready) d.ready = cur.ready;
  if (init.metro !== cur.metro) d.metro = cur.metro;
  if (init.address !== cur.address) d.address = cur.address;
  if (init.comments !== cur.comments) d.comments = cur.comments;
  if (init.crossingsJson !== cur.crossingsJson) d.crossings = cur.crossingsJson;
  return Object.keys(d).length > 0 ? d : null;
}

function serializeState(rows: EditableRow[], pendingDeleteIds: number[]): string {
  return JSON.stringify({
    rows: rows.map((r) => ({
      k: r.key,
      sid: r.serverId,
      idSys: r.idSys,
      name: r.name,
      short: r.short,
      ready: r.ready,
      metro: r.metro,
      address: r.address,
      comments: r.comments,
      cj: r.crossingsJson,
    })),
    pd: [...pendingDeleteIds].sort((a, b) => a - b),
  });
}

function NavLocationsPage() {
  const { user, loading: authLoading } = useAuth();
  const navRights = user?.rights_by_goals['nav_data'] ?? [];
  const canEdit = navRights.includes('edit');
  const canCreate = navRights.includes('create');
  const canDelete = navRights.includes('delete');

  const [rows, setRows] = useState<EditableRow[]>([]);
  const [initialById, setInitialById] = useState<Map<number, EditableRow>>(new Map());
  const [baseline, setBaseline] = useState('');
  const [pendingDeleteIds, setPendingDeleteIds] = useState<number[]>([]);

  const [filterId, setFilterId] = useState('');
  const [filterIdSys, setFilterIdSys] = useState('');
  const [appliedId, setAppliedId] = useState('');
  const [appliedIdSys, setAppliedIdSys] = useState('');

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<{ text: string; color: 'success' | 'danger' } | null>(null);

  const [auditories, setAuditories] = useState<NavAuditory[]>([]);

  const [commentsModal, setCommentsModal] = useState<{
    rowKey: string;
    draft: string;
  } | null>(null);

  const [crossModal, setCrossModal] = useState<{
    rowKey: string;
    triples: CrossingTriple[];
  } | null>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    const idNum = appliedId.trim() === '' ? undefined : parseInt(appliedId.trim(), 10);
    const idSysVal = appliedIdSys.trim() === '' ? undefined : appliedIdSys.trim();
    const filters =
      idNum !== undefined && !Number.isNaN(idNum)
        ? { id: idNum, idSys: idSysVal }
        : idSysVal !== undefined
          ? { idSys: idSysVal }
          : undefined;

    const { locations, error: locErr } = await getNavLocations(filters);
    if (locErr) {
      setError(locErr);
      setRows([]);
      setInitialById(new Map());
      setBaseline('');
      setPendingDeleteIds([]);
      setLoading(false);
      return;
    }

    const nextRows = locations.map(fromApi);
    const m = new Map<number, EditableRow>();
    nextRows.forEach((r) => {
      if (r.serverId != null) m.set(r.serverId, cloneRow(r));
    });
    setRows(nextRows);
    setInitialById(m);
    setPendingDeleteIds([]);
    const sig = serializeState(nextRows, []);
    setBaseline(sig);
    setLoading(false);
  }, [appliedId, appliedIdSys]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  useEffect(() => {
    void (async () => {
      const { items: types, error: tErr } = await getNavTypes();
      if (tErr) return;
      const crossingType =
        types.find((x) => /переход/i.test(x.name)) ??
        types.find((x) => x.id === NAV_CROSSING_TYPE_ID_FALLBACK);
      const typeId = crossingType?.id ?? NAV_CROSSING_TYPE_ID_FALLBACK;
      const { items, error: aErr } = await getNavAuditoriesByTypeId(typeId);
      if (!aErr) setAuditories(items);
    })();
  }, []);

  const dirty = useMemo(() => {
    return serializeState(rows, pendingDeleteIds) !== baseline;
  }, [rows, pendingDeleteIds, baseline]);

  const handleApplyFilters = () => {
    setAppliedId(filterId);
    setAppliedIdSys(filterIdSys);
  };

  const handleRefresh = () => {
    void loadData();
  };

  const canSave = useMemo(() => {
    if (!dirty || saving) return false;
    if (pendingDeleteIds.length > 0 && !canDelete) return false;
    if (rows.some((r) => r.serverId == null) && !canCreate) return false;
    const hasUpdates = rows.some((r) => {
      if (r.serverId == null) return false;
      const init = initialById.get(r.serverId);
      if (!init) return false;
      return diffRow(init, r) != null;
    });
    if (hasUpdates && !canEdit) return false;
    return true;
  }, [dirty, saving, pendingDeleteIds, rows, initialById, canDelete, canCreate, canEdit]);

  const updateRow = (key: string, patch: Partial<EditableRow>) => {
    setRows((prev) => prev.map((r) => (r.key === key ? { ...r, ...patch } : r)));
  };

  const openComments = (row: EditableRow) => {
    setCommentsModal({ rowKey: row.key, draft: row.comments ?? '' });
  };

  const applyCommentsModal = () => {
    if (!commentsModal) return;
    updateRow(commentsModal.rowKey, { comments: commentsModal.draft });
    setCommentsModal(null);
  };

  const openCrossings = (row: EditableRow) => {
    setCrossModal({
      rowKey: row.key,
      triples: parseCrossingsTriples(row.crossingsJson),
    });
  };

  const applyCrossModal = () => {
    if (!crossModal) return;
    updateRow(crossModal.rowKey, { crossingsJson: triplesToJson(crossModal.triples) });
    setCrossModal(null);
  };

  const addRow = () => {
    const key = `n-${crypto.randomUUID()}`;
    setRows((prev) => [...prev, emptyNewRow(key)]);
  };

  const removeRow = (row: EditableRow) => {
    if (row.serverId != null) {
      setPendingDeleteIds((p) => [...p, row.serverId!]);
    }
    setRows((prev) => prev.filter((r) => r.key !== row.key));
  };

  const handleCancel = () => {
    void loadData();
  };

  const handleSave = async () => {
    setSaving(true);
    setNotice(null);
    setError(null);

    try {
      for (const id of pendingDeleteIds) {
        const { error: delErr } = await deleteNavLocation(id);
        if (delErr) {
          setError(delErr);
          setSaving(false);
          return;
        }
      }

      const creates = rows.filter((r) => r.serverId == null);
      for (const r of creates) {
        const data: NavLocationCreateInput = {
          idSys: r.idSys,
          name: r.name,
          short: r.short,
          ready: r.ready,
          address: r.address,
          metro: r.metro,
          comments: r.comments,
          crossings: r.crossingsJson,
        };
        const { error: cErr } = await createNavLocation(data);
        if (cErr) {
          setError(cErr);
          setSaving(false);
          return;
        }
      }

      const updates: Array<{ id: number; data: NavLocationUpdateInput }> = [];
      for (const r of rows) {
        if (r.serverId == null) continue;
        const init = initialById.get(r.serverId);
        if (!init) continue;
        const d = diffRow(init, r);
        if (d) updates.push({ id: r.serverId, data: d });
      }

      if (updates.length > 0) {
        const { error: uErr } = await updateNavLocationsBatch(updates);
        if (uErr) {
          setError(uErr);
          setSaving(false);
          return;
        }
      }

      setNotice({ text: 'Сохранено', color: 'success' });
      await loadData();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Ошибка сохранения');
    } finally {
      setSaving(false);
    }
  };

  const commentsActionTitle = (c: string | null) =>
    c == null || c === '' ? 'Добавить комментарий' : 'Редактировать комментарий';

  const crossingsActionTitle = (cj: string) => {
    const t = parseCrossingsTriples(cj);
    return t.length === 0 ? 'Добавить переходы' : 'Редактировать переходы';
  };

  if (authLoading) {
    return (
      <RequirePermission goal="nav_data" right="view">
        <Page headerText="Редактирование локаций кампуса">
          <LinearProgress />
        </Page>
      </RequirePermission>
    );
  }

  return (
    <RequirePermission goal="nav_data" right="view">
      <Page headerText="Редактирование локаций кампуса">
        <Stack spacing={2}>
          {notice && (
            <Alert color={notice.color} variant="soft" sx={{ mb: 2 }}>
              {notice.text}
            </Alert>
          )}

          <Box
            sx={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: 2,
              mb: 2,
            }}
          >
            <Stack direction="row" spacing={2} alignItems="center" flexWrap="wrap">
              <Typography level="h4">Локации кампуса</Typography>
              {!loading && rows.length > 0 && (
                <Chip size="sm" variant="soft" color="neutral">
                  {rows.length} записей
                </Chip>
              )}
            </Stack>
            <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap">
              <IconButton
                variant="outlined"
                size="sm"
                onClick={handleRefresh}
                disabled={loading || saving}
                title="Обновить список"
              >
                <RefreshIcon fontSize="small" />
              </IconButton>
            </Stack>
          </Box>

          <Sheet variant="outlined" sx={{ borderRadius: 'sm', p: 2, mb: 2 }}>
            <Stack spacing={2}>
              <Stack
                direction={{ xs: 'column', sm: 'row' }}
                spacing={2}
                alignItems={{ xs: 'stretch', sm: 'flex-end' }}
                flexWrap="wrap"
                useFlexGap
              >
                <FormControl sx={{ minWidth: 140, flex: { sm: '0 1 auto' } }}>
                  <FormLabel>Фильтр по id</FormLabel>
                  <Input
                    value={filterId}
                    onChange={(e) => setFilterId(e.target.value)}
                    placeholder="все"
                    onKeyDown={(e) => e.key === 'Enter' && handleApplyFilters()}
                  />
                </FormControl>
                <FormControl sx={{ minWidth: 200, flex: { sm: '1 1 200px' } }}>
                  <FormLabel>Фильтр по idSys</FormLabel>
                  <Input
                    value={filterIdSys}
                    onChange={(e) => setFilterIdSys(e.target.value)}
                    placeholder="все"
                    onKeyDown={(e) => e.key === 'Enter' && handleApplyFilters()}
                    startDecorator={<FilterIcon fontSize="small" />}
                  />
                </FormControl>
                <Button variant="solid" onClick={handleApplyFilters} loading={loading}>
                  Применить
                </Button>
              </Stack>
            </Stack>
          </Sheet>

          {loading && <LinearProgress />}

          {error && (
            <Alert color="danger" variant="soft" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          {rows.length === 0 && !loading && !error ? (
            <Card variant="outlined" sx={{ borderRadius: 'sm' }}>
              <Box sx={{ p: 4, textAlign: 'center' }}>
                <MapIcon
                  sx={{
                    fontSize: 48,
                    color: 'var(--joy-palette-neutral-400)',
                    display: 'block',
                    mx: 'auto',
                    mb: 2,
                  }}
                />
                <Typography level="title-md" color="neutral">
                  Нет локаций по текущим фильтрам
                </Typography>
                <Typography level="body-sm" sx={{ mt: 1 }}>
                  Смените фильтры или нажмите «Добавить помещение»
                </Typography>
              </Box>
            </Card>
          ) : (
            <>
              <Sheet
                variant="outlined"
                sx={{
                  borderRadius: 'sm',
                  overflowX: 'auto',
                  overflowY: 'hidden',
                  '& tbody tr:nth-child(odd)': {
                    backgroundColor: 'rgba(0, 0, 0, 0.04)',
                  },
                  '& tbody tr:nth-child(even)': {
                    backgroundColor: 'rgba(0, 0, 0, 0.08)',
                  },
                  '& tbody tr:hover': {
                    backgroundColor: 'rgba(0, 0, 0, 0.12)',
                  },
                }}
              >
                <Table
                  stickyHeader
                  sx={{
                    minWidth: 1200,
                    '& th, & td': {
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                    },
                    '& th': {
                      backgroundColor: 'var(--joy-palette-background-level1)',
                      fontWeight: 'bold',
                      fontSize: '0.75rem',
                    },
                  }}
                >
                  <thead>
                    <tr>
                      <th style={{ padding: '8px', width: 60 }}>id</th>
                      <th style={{ padding: '8px', width: 120 }}>idSys</th>
                      <th style={{ padding: '8px', width: 180 }}>название</th>
                      <th style={{ padding: '8px', width: 150 }}>краткое название</th>
                      <th style={{ padding: '8px', width: 80 }}>готовность</th>
                      <th style={{ padding: '8px', width: 120 }}>метро</th>
                      <th style={{ padding: '8px', width: 200 }}>адрес</th>
                      <th style={{ padding: '8px', width: 150 }}>комментарии</th>
                      <th style={{ padding: '8px', width: 100 }}>переходы</th>
                      <th style={{ padding: '8px', width: 56, textAlign: 'right' }} />
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((row) => (
                      <tr
                        key={row.key}
                        style={{
                          backgroundColor: row.isNew ? 'rgba(25, 118, 210, 0.12)' : undefined,
                          transition: 'background-color 0.2s ease',
                        }}
                      >
                        <td style={{ padding: '8px', verticalAlign: 'middle' }}>
                          <Typography level="body-sm" fontSize="0.75rem">{row.serverId ?? '—'}</Typography>
                        </td>
                        <td style={{ padding: '8px', verticalAlign: 'middle' }}>
                          <Input
                            size="sm"
                            value={row.idSys}
                            onChange={(e) => updateRow(row.key, { idSys: e.target.value })}
                            disabled={!canEdit}
                            sx={{
                              '& input': {
                                fontSize: '0.75rem',
                                py: 0.5,
                              }
                            }}
                          />
                        </td>
                        <td style={{ padding: '8px', verticalAlign: 'middle' }}>
                          <Input
                            size="sm"
                            value={row.name}
                            onChange={(e) => updateRow(row.key, { name: e.target.value })}
                            disabled={!canEdit}
                            sx={{
                              '& input': {
                                fontSize: '0.75rem',
                                py: 0.5,
                              }
                            }}
                          />
                        </td>
                        <td style={{ padding: '8px', verticalAlign: 'middle' }}>
                          <Input
                            size="sm"
                            value={row.short}
                            onChange={(e) => updateRow(row.key, { short: e.target.value })}
                            disabled={!canEdit}
                            sx={{
                              '& input': {
                                fontSize: '0.75rem',
                                py: 0.5,
                              }
                            }}
                          />
                        </td>
                        <td style={{ padding: '8px', verticalAlign: 'middle' }}>
                          {canEdit ? (
                            <Switch
                              checked={row.ready}
                              onChange={(e) => updateRow(row.key, { ready: e.target.checked })}
                              size="sm"
                            />
                          ) : (
                            <Chip size="sm" variant="soft" color={row.ready ? 'success' : 'neutral'} sx={{ fontSize: '0.7rem' }}>
                              {row.ready ? 'Да' : 'Нет'}
                            </Chip>
                          )}
                        </td>
                        <td style={{ padding: '8px', verticalAlign: 'middle' }}>
                          <Input
                            size="sm"
                            value={row.metro}
                            onChange={(e) => updateRow(row.key, { metro: e.target.value })}
                            disabled={!canEdit}
                            sx={{
                              '& input': {
                                fontSize: '0.75rem',
                                py: 0.5,
                              }
                            }}
                          />
                        </td>
                        <td style={{ padding: '8px', verticalAlign: 'middle' }}>
                          <Input
                            size="sm"
                            value={row.address}
                            onChange={(e) => updateRow(row.key, { address: e.target.value })}
                            disabled={!canEdit}
                            sx={{
                              '& input': {
                                fontSize: '0.75rem',
                                py: 0.5,
                              }
                            }}
                          />
                        </td>
                        <td style={{ padding: '8px', verticalAlign: 'middle' }}>
                          <Stack direction="row" spacing={0.5} alignItems="center" sx={{ width: '100%' }}>
                            <Typography
                              level="body-sm"
                              sx={{
                                flex: 1,
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                fontSize: '0.75rem',
                              }}
                            >
                              {row.comments || ''}
                            </Typography>
                            {row.comments == null || row.comments === '' ? (
                              <IconButton
                                size="sm"
                                color="neutral"
                                variant="plain"
                                onClick={() => openComments(row)}
                                disabled={!canEdit}
                                title={commentsActionTitle(row.comments)}
                                sx={{ p: 0.5, opacity: 0.4, '&:hover': { opacity: 1 } }}
                              >
                                <AddComment fontSize="small" />
                              </IconButton>
                            ) : (
                              <IconButton
                                size="sm"
                                color="primary"
                                variant="plain"
                                onClick={() => openComments(row)}
                                disabled={!canEdit}
                                title={commentsActionTitle(row.comments)}
                                sx={{ p: 0.5 }}
                              >
                                <Comment fontSize="small" />
                              </IconButton>
                            )}
                          </Stack>
                        </td>
                        <td style={{ padding: '8px', verticalAlign: 'middle' }}>
                          <Stack direction="row" spacing={0.5} sx={{ width: 'fit-content' }}>
                            {parseCrossingsTriples(row.crossingsJson).length === 0 ? (
                              <IconButton
                                size="sm"
                                color="primary"
                                variant="outlined"
                                onClick={() => openCrossings(row)}
                                disabled={!canEdit}
                                title={crossingsActionTitle(row.crossingsJson)}
                                sx={{ p: 0.5 }}
                              >
                                <AltRoute fontSize="small" />
                              </IconButton>
                            ) : (
                              <IconButton
                                size="sm"
                                color="primary"
                                onClick={() => openCrossings(row)}
                                disabled={!canEdit}
                                title={crossingsActionTitle(row.crossingsJson)}
                                sx={{ p: 0.5 }}
                              >
                                <AltRoute fontSize="small" />
                              </IconButton>
                            )}
                          </Stack>
                        </td>
                        <td style={{ padding: '8px', textAlign: 'right', verticalAlign: 'middle' }}>
                          <RequirePermission goal="nav_data" right="delete">
                            <IconButton
                              size="sm"
                              color="danger"
                              onClick={() => removeRow(row)}
                              disabled={!canDelete}
                              title="Удалить строку"
                              sx={{ p: 0.5 }}
                            >
                              <DeleteIcon fontSize="small" />
                            </IconButton>
                          </RequirePermission>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              </Sheet>

              {/* Кнопка добавления внизу */}
              <Stack direction="row" justifyContent="flex-end">
                <RequirePermission goal="nav_data" right="create">
                  <Button
                    variant="solid"
                    color="primary"
                    startDecorator={<Add />}
                    onClick={addRow}
                    disabled={!canCreate}
                  >
                    Добавить помещение
                  </Button>
                </RequirePermission>
              </Stack>
            </>
          )}

          <Sheet variant="outlined" sx={{ borderRadius: 'sm', p: 2 }}>
            <Stack direction="row" spacing={2} flexWrap="wrap" useFlexGap alignItems="center">
              <Button
                variant="solid"
                color="primary"
                onClick={handleSave}
                disabled={!canSave}
                loading={saving}
              >
                Сохранить
              </Button>
              <Button variant="outlined" onClick={handleCancel} disabled={!dirty || saving}>
                Отменить
              </Button>
            </Stack>
          </Sheet>
        </Stack>
      </Page>

      <Modal open={!!commentsModal} onClose={() => setCommentsModal(null)}>
        <ModalDialog sx={{ minWidth: 360 }}>
          <ModalClose />
          <Typography level="h4">Комментарий</Typography>
          <Divider sx={{ my: 2 }} />
          <Textarea
            minRows={4}
            value={commentsModal?.draft ?? ''}
            onChange={(e) => setCommentsModal((m) => (m ? { ...m, draft: e.target.value } : m))}
          />
          <Stack direction="row" spacing={1} sx={{ mt: 2, justifyContent: 'flex-end' }}>
            <Button variant="outlined" onClick={() => setCommentsModal(null)}>
              Отмена
            </Button>
            <Button variant="solid" color="primary" onClick={applyCommentsModal}>
              Ок
            </Button>
          </Stack>
        </ModalDialog>
      </Modal>

      <Modal open={!!crossModal} onClose={() => setCrossModal(null)}>
        <ModalDialog sx={{ minWidth: 480, maxWidth: 'min(96vw, 720px)' }}>
          <ModalClose />
          <Typography level="h4">Переходы</Typography>
          <Divider sx={{ my: 2 }} />
          <Stack spacing={2}>
            {crossModal?.triples.map((tr, idx) => (
              <Stack
                key={idx}
                direction={{ xs: 'column', sm: 'row' }}
                spacing={1}
                alignItems={{ sm: 'center' }}
              >
                <Select
                  size="sm"
                  placeholder="От"
                  value={tr[0]}
                  onChange={(_, v) =>
                    setCrossModal((m) => {
                      if (!m) return m;
                      const next = [...m.triples];
                      next[idx] = [v ?? '', tr[1], tr[2]];
                      return { ...m, triples: next };
                    })
                  }
                  sx={{ minWidth: 160 }}
                >
                  {auditories.map((a) => (
                    <Option key={`a-${a.id}-${idx}`} value={a.idSys}>
                      {a.idSys}
                    </Option>
                  ))}
                </Select>
                <Select
                  size="sm"
                  placeholder="Куда"
                  value={tr[1]}
                  onChange={(_, v) =>
                    setCrossModal((m) => {
                      if (!m) return m;
                      const next = [...m.triples];
                      next[idx] = [tr[0], v ?? '', tr[2]];
                      return { ...m, triples: next };
                    })
                  }
                  sx={{ minWidth: 160 }}
                >
                  {auditories.map((a) => (
                    <Option key={`b-${a.id}-${idx}`} value={a.idSys}>
                      {a.idSys}
                    </Option>
                  ))}
                </Select>
                <Input
                  type="number"
                  size="sm"
                  slotProps={{ input: { step: 0.1 } }}
                  value={String(tr[2])}
                  onChange={(e) => {
                    const n = parseFloat(e.target.value);
                    setCrossModal((m) => {
                      if (!m) return m;
                      const next = [...m.triples];
                      next[idx] = [tr[0], tr[1], Number.isFinite(n) ? n : 300];
                      return { ...m, triples: next };
                    });
                  }}
                  sx={{ width: 120 }}
                />
                <IconButton
                  color="danger"
                  onClick={() =>
                    setCrossModal((m) => {
                      if (!m) return m;
                      const next = m.triples.filter((_, i) => i !== idx);
                      return { ...m, triples: next };
                    })
                  }
                  size="sm"
                >
                  <DeleteIcon fontSize="small" />
                </IconButton>
              </Stack>
            ))}
            <Button
              variant="outlined"
              color="neutral"
              onClick={() =>
                setCrossModal((m) =>
                  m
                    ? {
                        ...m,
                        triples: [...m.triples, ['', '', 300]],
                      }
                    : m
                )
              }
            >
              Добавить переход
            </Button>
          </Stack>
          <Stack direction="row" spacing={1} sx={{ mt: 2, justifyContent: 'flex-end' }}>
            <Button variant="outlined" onClick={() => setCrossModal(null)}>
              Отмена
            </Button>
            <Button variant="solid" color="primary" onClick={applyCrossModal}>
              Ок
            </Button>
          </Stack>
        </ModalDialog>
      </Modal>
    </RequirePermission>
  );
}

export default NavLocationsPage;

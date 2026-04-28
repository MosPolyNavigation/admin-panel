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
  Comment,
  Delete as DeleteIcon,
  FilterList as FilterIcon,
  Refresh as RefreshIcon,
  PhotoLibrary,
} from '@mui/icons-material';
import Page from '../components/Page.tsx';
import { RequirePermission } from '../components/RequirePermission.tsx';
import { useAuth } from '../hooks/useAuth.ts';
import PaginationControls from '../components/PaginationControls.tsx';
import {
  createNavAuditory,
  deleteNavAuditory,
  getNavAuditories,
  getNavPlans,
  getNavTypes,
  updateNavAuditoriesBatch,
  type NavAuditory2,
  type NavAuditoryCreateInput,
  type NavAuditoryUpdateInput,
  type NavPlan,
  type NavType,
} from '../api';

interface EditableRow {
  key: string;
  serverId: number | null;
  idSys: string;
  typeId: number | null;
  ready: boolean;
  planId: number | null;
  name: string;
  textFromSign: string | null;
  additionalInfo: string | null;
  comments: string | null;
  link: string | null;
  typeName: string;
  planName: string;
  photosCount: number;
}

function fromApi(auditory: NavAuditory2): EditableRow {
  return {
    key: `s-${auditory.id}`,
    serverId: auditory.id,
    idSys: auditory.idSys,
    typeId: auditory.typeId,
    ready: auditory.ready,
    planId: auditory.planId,
    name: auditory.name,
    textFromSign: auditory.textFromSign,
    additionalInfo: auditory.additionalInfo,
    comments: auditory.comments,
    link: auditory.link,
    typeName: auditory.type?.name ?? `ID: ${auditory.typeId}`,
    planName: auditory.plan?.idSys ?? `ID: ${auditory.planId}`,
    photosCount: auditory.photos?.length ?? 0,
  };
}

function emptyNewRow(key: string): EditableRow {
  return {
    key,
    serverId: null,
    idSys: '',
    typeId: null,
    ready: true,
    planId: null,
    name: '',
    textFromSign: null,
    additionalInfo: null,
    comments: null,
    link: null,
    typeName: '',
    planName: '',
    photosCount: 0,
  };
}

function cloneRow(r: EditableRow): EditableRow {
  return { ...r };
}

function diffRow(init: EditableRow, cur: EditableRow): NavAuditoryUpdateInput | null {
  const d: NavAuditoryUpdateInput = {};
  if (init.idSys !== cur.idSys) d.idSys = cur.idSys;
  if (init.typeId !== cur.typeId) d.typeId = cur.typeId ?? undefined;
  if (init.ready !== cur.ready) d.ready = cur.ready;
  if (init.planId !== cur.planId) d.planId = cur.planId ?? undefined;
  if (init.name !== cur.name) d.name = cur.name;
  if (init.textFromSign !== cur.textFromSign) d.textFromSign = cur.textFromSign;
  if (init.additionalInfo !== cur.additionalInfo) d.additionalInfo = cur.additionalInfo;
  if (init.comments !== cur.comments) d.comments = cur.comments;
  if (init.link !== cur.link) d.link = cur.link;
  return Object.keys(d).length > 0 ? d : null;
}

function serializeState(rows: EditableRow[], pendingDeleteIds: number[]): string {
  return JSON.stringify({
    rows: rows.map((r) => ({
      k: r.key,
      sid: r.serverId,
      idSys: r.idSys,
      typeId: r.typeId,
      ready: r.ready,
      planId: r.planId,
      name: r.name,
      tfs: r.textFromSign,
      ai: r.additionalInfo,
      c: r.comments,
      l: r.link,
    })),
    pd: [...pendingDeleteIds].sort((a, b) => a - b),
  });
}

const DEFAULT_PAGE_SIZE = 20;

function NavAuditoriesPage() {
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
  const [filterName, setFilterName] = useState('');
  const [appliedId, setAppliedId] = useState('');
  const [appliedIdSys, setAppliedIdSys] = useState('');
  const [appliedName, setAppliedName] = useState('');

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<{ text: string; color: 'success' | 'danger' } | null>(null);

  const [plans, setPlans] = useState<NavPlan[]>([]);
  const [types, setTypes] = useState<NavType[]>([]);

  const [commentsModal, setCommentsModal] = useState<{
    rowKey: string;
    field: 'comments' | 'additionalInfo';
    draft: string;
  } | null>(null);

  // Пагинация
  const [currentPage, setCurrentPage] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);

    const filters: Record<string, unknown> = {};
    if (appliedId.trim() !== '') {
      const idNum = parseInt(appliedId.trim(), 10);
      if (!Number.isNaN(idNum)) filters.id = idNum;
    }
    if (appliedIdSys.trim() !== '') filters.idSys = appliedIdSys.trim();
    if (appliedName.trim() !== '') filters.name = appliedName.trim();

    const offset = (currentPage - 1) * pageSize;

    const {
      auditories,
      pagination,
      error: audErr,
    } = await getNavAuditories(Object.keys(filters).length > 0 ? filters : undefined, {
      limit: pageSize,
      offset,
    });

    if (audErr) {
      setError(audErr);
      setRows([]);
      setInitialById(new Map());
      setBaseline('');
      setPendingDeleteIds([]);
      setLoading(false);
      return;
    }

    setTotalItems(pagination?.totalCount ?? 0);

    const nextRows = auditories.map(fromApi);
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
  }, [appliedId, appliedIdSys, appliedName, pageSize, currentPage]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  useEffect(() => {
    let cancelled = false;

    void (async () => {
      const [{ items: typesItems, error: tErr }, { plans: plansItems, error: pErr }] =
        await Promise.all([getNavTypes(100), getNavPlans(undefined, { limit: 200 })]);

      if (cancelled) return;
      if (!tErr) setTypes(typesItems);
      if (!pErr) setPlans(plansItems);
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  const dirty = useMemo(() => {
    return serializeState(rows, pendingDeleteIds) !== baseline;
  }, [rows, pendingDeleteIds, baseline]);

  const handleApplyFilters = () => {
    setCurrentPage(1);
    setAppliedId(filterId);
    setAppliedIdSys(filterIdSys);
    setAppliedName(filterName);
  };

  const handleRefresh = () => {
    void loadData();
  };

  const handlePageChange = (page: number) => {
    if (page !== currentPage) {
      setCurrentPage(page);
    }
  };

  const handlePageSizeChange = (newSize: number) => {
    if (newSize !== pageSize) {
      setPageSize(newSize);
      setCurrentPage(1);
    }
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

  const openComments = (row: EditableRow, field: 'comments' | 'additionalInfo') => {
    setCommentsModal({
      rowKey: row.key,
      field,
      draft: field === 'comments' ? (row.comments ?? '') : (row.additionalInfo ?? ''),
    });
  };

  const applyCommentsModal = () => {
    if (!commentsModal) return;
    if (commentsModal.field === 'comments') {
      updateRow(commentsModal.rowKey, { comments: commentsModal.draft || null });
    } else {
      updateRow(commentsModal.rowKey, { additionalInfo: commentsModal.draft || null });
    }
    setCommentsModal(null);
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
        const { error: delErr } = await deleteNavAuditory(id);
        if (delErr) {
          setError(delErr);
          setSaving(false);
          return;
        }
      }

      const creates = rows.filter((r) => r.serverId == null);
      for (const r of creates) {
        if (r.typeId == null || r.planId == null) {
          setError('Необходимо выбрать тип и план');
          setSaving(false);
          return;
        }
        const data: NavAuditoryCreateInput = {
          idSys: r.idSys,
          typeId: r.typeId,
          ready: r.ready,
          planId: r.planId,
          name: r.name,
          textFromSign: r.textFromSign,
          additionalInfo: r.additionalInfo,
          comments: r.comments,
          link: r.link,
        };
        const { error: cErr } = await createNavAuditory(data);
        if (cErr) {
          setError(cErr);
          setSaving(false);
          return;
        }
      }

      const updates: Array<{ id: number; data: NavAuditoryUpdateInput }> = [];
      for (const r of rows) {
        if (r.serverId == null) continue;
        const init = initialById.get(r.serverId);
        if (!init) continue;
        const d = diffRow(init, r);
        if (d) updates.push({ id: r.serverId, data: d });
      }

      if (updates.length > 0) {
        const { error: uErr } = await updateNavAuditoriesBatch(updates);
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

  const commentsActionTitle = (c: string | null, field: 'comments' | 'additionalInfo') => {
    const label = field === 'comments' ? 'комментарий' : 'доп. информацию';
    return c == null || c === '' ? `Добавить ${label}` : `Редактировать ${label}`;
  };

  const getTypeName = (typeId: number | null): string => {
    if (typeId == null) return '—';
    const type = types.find((t) => t.id === typeId);
    return type?.name ?? `ID: ${typeId}`;
  };

  const getPlanName = (planId: number | null): string => {
    if (planId == null) return '—';
    const plan = plans.find((p) => p.id === planId);
    return plan?.idSys ?? `ID: ${planId}`;
  };

  const totalPages = useMemo(() => {
    if (totalItems === 0) return 1;
    return Math.ceil(totalItems / pageSize);
  }, [totalItems, pageSize]);

  if (authLoading) {
    return (
      <RequirePermission goal="nav_data" right="view">
        <Page headerText="Редактирование аудиторий навигации">
          <LinearProgress />
        </Page>
      </RequirePermission>
    );
  }

  return (
    <RequirePermission goal="nav_data" right="view">
      <Page headerText="Редактирование аудиторий навигации">
        <Stack spacing={2}>
          {notice && (
            <Alert color={notice.color} variant="soft" sx={{ mb: 2 }}>
              {notice.text}
            </Alert>
          )}

          {/* Заголовок и элементы управления */}
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
              <Typography level="h4">Аудитории навигации</Typography>
              {!loading && rows.length > 0 && (
                <Chip size="sm" variant="soft" color="neutral">
                  {rows.length} записей
                </Chip>
              )}
            </Stack>

            <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap">
              <Stack direction="row" spacing={1} alignItems="center">
                <Typography level="body-sm">На странице:</Typography>
                <Select
                  size="sm"
                  value={pageSize}
                  onChange={(_, v) => v && handlePageSizeChange(v)}
                  sx={{ minWidth: 70 }}
                >
                  <Option value={10}>10</Option>
                  <Option value={20}>20</Option>
                  <Option value={50}>50</Option>
                  <Option value={100}>100</Option>
                </Select>
              </Stack>
              <IconButton
                variant="outlined"
                size="sm"
                onClick={handleRefresh}
                disabled={loading || saving}
                title="Обновить список"
              >
                <RefreshIcon fontSize="small" />
              </IconButton>
              <RequirePermission goal="nav_data" right="create">
                <Button
                  variant="solid"
                  color="primary"
                  startDecorator={<Add />}
                  onClick={addRow}
                  disabled={!canCreate}
                >
                  Добавить строку
                </Button>
              </RequirePermission>
            </Stack>
          </Box>

          {/* Фильтры */}
          <Sheet variant="outlined" sx={{ borderRadius: 'sm', p: 2, mb: 2 }}>
            <Stack spacing={2}>
              <Stack
                direction={{ xs: 'column', sm: 'row' }}
                spacing={2}
                alignItems={{ xs: 'stretch', sm: 'flex-end' }}
                flexWrap="wrap"
                useFlexGap
              >
                <FormControl sx={{ minWidth: 100, flex: { sm: '0 1 auto' } }}>
                  <FormLabel>Фильтр по id</FormLabel>
                  <Input
                    value={filterId}
                    onChange={(e) => setFilterId(e.target.value)}
                    placeholder="все"
                    onKeyDown={(e) => e.key === 'Enter' && handleApplyFilters()}
                  />
                </FormControl>
                <FormControl sx={{ minWidth: 150, flex: { sm: '0 1 auto' } }}>
                  <FormLabel>Фильтр по idSys</FormLabel>
                  <Input
                    value={filterIdSys}
                    onChange={(e) => setFilterIdSys(e.target.value)}
                    placeholder="все"
                    onKeyDown={(e) => e.key === 'Enter' && handleApplyFilters()}
                    startDecorator={<FilterIcon fontSize="small" />}
                  />
                </FormControl>
                <FormControl sx={{ minWidth: 200, flex: { sm: '1 1 200px' } }}>
                  <FormLabel>Фильтр по названию</FormLabel>
                  <Input
                    value={filterName}
                    onChange={(e) => setFilterName(e.target.value)}
                    placeholder="все"
                    onKeyDown={(e) => e.key === 'Enter' && handleApplyFilters()}
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
                <Typography level="title-md" color="neutral">
                  Нет аудиторий по текущим фильтрам
                </Typography>
                <Typography level="body-sm" sx={{ mt: 1 }}>
                  Смените фильтры или нажмите «Добавить строку»
                </Typography>
              </Box>
            </Card>
          ) : (
            <Sheet
              variant="outlined"
              sx={{ borderRadius: 'sm', overflowX: 'auto', overflowY: 'hidden' }}
            >
              <Table
                stickyHeader
                sx={{
                  minWidth: 1300,
                  '& th, & td': {
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    maxWidth: 0,
                  },
                }}
              >
                <thead>
                  <tr>
                    <th style={{ padding: '12px', width: 60 }}>id</th>
                    <th style={{ padding: '12px', width: 100 }}>idSys</th>
                    <th style={{ padding: '12px', width: 150 }}>Название</th>
                    <th style={{ padding: '12px', width: 150 }}>Тип</th>
                    <th style={{ padding: '12px', width: 120 }}>План</th>
                    <th style={{ padding: '12px', width: 80 }}>ready</th>
                    <th style={{ padding: '12px', width: 120 }}>Текст с таблички</th>
                    <th style={{ padding: '12px', width: 100 }}>Комментарий</th>
                    <th style={{ padding: '12px', width: 100 }}>Доп. инфо</th>
                    <th style={{ padding: '12px', width: 80 }}>Фото</th>
                    <th style={{ padding: '12px', width: 100 }}>Ссылка</th>
                    <th style={{ padding: '12px', width: 56, textAlign: 'right' }} />
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row) => (
                    <tr key={row.key}>
                      <td style={{ padding: '12px', verticalAlign: 'middle' }}>
                        <Typography level="body-sm">{row.serverId ?? '—'}</Typography>
                      </td>
                      <td style={{ padding: '12px', verticalAlign: 'middle' }}>
                        <Input
                          size="sm"
                          value={row.idSys}
                          onChange={(e) => updateRow(row.key, { idSys: e.target.value })}
                          disabled={!canEdit}
                          sx={{ maxWidth: '100%', '& input': { textOverflow: 'ellipsis' } }}
                        />
                      </td>
                      <td style={{ padding: '12px', verticalAlign: 'middle' }}>
                        <Input
                          size="sm"
                          value={row.name}
                          onChange={(e) => updateRow(row.key, { name: e.target.value })}
                          disabled={!canEdit}
                          sx={{ maxWidth: '100%', '& input': { textOverflow: 'ellipsis' } }}
                        />
                      </td>
                      <td style={{ padding: '12px', verticalAlign: 'middle' }}>
                        {canEdit ? (
                          <Select
                            size="sm"
                            value={row.typeId ?? undefined}
                            onChange={(_, v) =>
                              updateRow(row.key, {
                                typeId: v ?? null,
                                typeName: types.find((t) => t.id === v)?.name ?? '',
                              })
                            }
                            placeholder="Тип"
                            sx={{ minWidth: 150, maxWidth: 150 }}
                          >
                            {types.map((t) => (
                              <Option key={t.id} value={t.id}>
                                {t.name}
                              </Option>
                            ))}
                          </Select>
                        ) : (
                          <Typography
                            level="body-sm"
                            sx={{
                              display: 'block',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              maxWidth: '100%',
                            }}
                            title={getTypeName(row.typeId)}
                          >
                            {getTypeName(row.typeId)}
                          </Typography>
                        )}
                      </td>
                      <td style={{ padding: '12px', verticalAlign: 'middle' }}>
                        {canEdit ? (
                          <Select
                            size="sm"
                            value={row.planId ?? undefined}
                            onChange={(_, v) =>
                              updateRow(row.key, {
                                planId: v ?? null,
                                planName: plans.find((p) => p.id === v)?.idSys ?? '',
                              })
                            }
                            placeholder="План"
                            sx={{ minWidth: 120, maxWidth: 120 }}
                          >
                            {plans.map((p) => (
                              <Option key={p.id} value={p.id}>
                                {p.idSys}
                              </Option>
                            ))}
                          </Select>
                        ) : (
                          <Typography
                            level="body-sm"
                            sx={{
                              display: 'block',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              maxWidth: '100%',
                            }}
                            title={getPlanName(row.planId)}
                          >
                            {getPlanName(row.planId)}
                          </Typography>
                        )}
                      </td>
                      <td style={{ padding: '12px', verticalAlign: 'middle' }}>
                        {canEdit ? (
                          <Switch
                            checked={row.ready}
                            onChange={(e) => updateRow(row.key, { ready: e.target.checked })}
                          />
                        ) : (
                          <Chip size="sm" variant="soft" color={row.ready ? 'success' : 'neutral'}>
                            {row.ready ? 'Да' : 'Нет'}
                          </Chip>
                        )}
                      </td>
                      <td style={{ padding: '12px', verticalAlign: 'middle' }}>
                        <Input
                          size="sm"
                          value={row.textFromSign ?? ''}
                          onChange={(e) =>
                            updateRow(row.key, { textFromSign: e.target.value || null })
                          }
                          disabled={!canEdit}
                          sx={{ maxWidth: '100%', '& input': { textOverflow: 'ellipsis' } }}
                        />
                      </td>
                      <td style={{ padding: '12px', verticalAlign: 'middle' }}>
                        <Stack direction="row" spacing={1} sx={{ width: 'fit-content' }}>
                          {row.comments == null || row.comments === '' ? (
                            <IconButton
                              size="sm"
                              color="primary"
                              variant="outlined"
                              onClick={() => openComments(row, 'comments')}
                              disabled={!canEdit}
                              title={commentsActionTitle(row.comments, 'comments')}
                              aria-label={commentsActionTitle(row.comments, 'comments')}
                            >
                              <AddComment fontSize="small" />
                            </IconButton>
                          ) : (
                            <IconButton
                              size="sm"
                              color="primary"
                              onClick={() => openComments(row, 'comments')}
                              disabled={!canEdit}
                              title={commentsActionTitle(row.comments, 'comments')}
                              aria-label={commentsActionTitle(row.comments, 'comments')}
                            >
                              <Comment fontSize="small" />
                            </IconButton>
                          )}
                        </Stack>
                      </td>
                      <td style={{ padding: '12px', verticalAlign: 'middle' }}>
                        <Stack direction="row" spacing={1} sx={{ width: 'fit-content' }}>
                          {row.additionalInfo == null || row.additionalInfo === '' ? (
                            <IconButton
                              size="sm"
                              color="primary"
                              variant="outlined"
                              onClick={() => openComments(row, 'additionalInfo')}
                              disabled={!canEdit}
                              title={commentsActionTitle(row.additionalInfo, 'additionalInfo')}
                              aria-label={commentsActionTitle(row.additionalInfo, 'additionalInfo')}
                            >
                              <AddComment fontSize="small" />
                            </IconButton>
                          ) : (
                            <IconButton
                              size="sm"
                              color="primary"
                              onClick={() => openComments(row, 'additionalInfo')}
                              disabled={!canEdit}
                              title={commentsActionTitle(row.additionalInfo, 'additionalInfo')}
                              aria-label={commentsActionTitle(row.additionalInfo, 'additionalInfo')}
                            >
                              <Comment fontSize="small" />
                            </IconButton>
                          )}
                        </Stack>
                      </td>
                      <td style={{ padding: '12px', verticalAlign: 'middle' }}>
                        <Stack direction="row" spacing={1} sx={{ width: 'fit-content' }}>
                          <Chip size="sm" variant="soft" color="neutral">
                            <PhotoLibrary fontSize="small" sx={{ mr: 0.5 }} />
                            {row.photosCount}
                          </Chip>
                        </Stack>
                      </td>
                      <td style={{ padding: '12px', verticalAlign: 'middle' }}>
                        <Input
                          size="sm"
                          value={row.link ?? ''}
                          onChange={(e) => updateRow(row.key, { link: e.target.value || null })}
                          disabled={!canEdit}
                          sx={{ maxWidth: '100%', '& input': { textOverflow: 'ellipsis' } }}
                        />
                      </td>
                      <td style={{ padding: '12px', textAlign: 'right', verticalAlign: 'middle' }}>
                        <RequirePermission goal="nav_data" right="delete">
                          <IconButton
                            size="sm"
                            color="danger"
                            onClick={() => removeRow(row)}
                            disabled={!canDelete}
                            title="Удалить строку"
                          >
                            <DeleteIcon />
                          </IconButton>
                        </RequirePermission>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </Sheet>
          )}

          {/* Кнопки сохранения */}
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

          {/* Пагинация */}
          {totalItems > 0 && totalPages > 1 && !loading && (
            <Box sx={{ mt: 1, display: 'flex', justifyContent: 'center' }}>
              <PaginationControls
                currentPage={currentPage}
                totalPages={totalPages}
                totalItems={totalItems}
                itemsPerPage={pageSize}
                onPageChange={handlePageChange}
                showInfo={true}
                compact={false}
              />
            </Box>
          )}
        </Stack>
      </Page>

      {/* Модальное окно комментария/доп. информации */}
      <Modal open={!!commentsModal} onClose={() => setCommentsModal(null)}>
        <ModalDialog sx={{ minWidth: 480, maxWidth: 'min(96vw, 720px)' }}>
          <ModalClose />
          <Typography level="h4">
            {commentsModal?.field === 'comments' ? 'Комментарий' : 'Дополнительная информация'}
          </Typography>
          <Divider sx={{ my: 2 }} />
          <Textarea
            minRows={6}
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
    </RequirePermission>
  );
}

export default NavAuditoriesPage;

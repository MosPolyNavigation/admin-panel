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
  Delete as DeleteIcon,
  FilterList as FilterIcon,
  Refresh as RefreshIcon,
  Upload,
  Visibility,
  Edit,
  Wc,
  DoorFront,
} from '@mui/icons-material';
import Page from '../components/Page.tsx';
import { RequirePermission } from '../components/RequirePermission.tsx';
import { useAuth } from '../hooks/useAuth.ts';
import PaginationControls from '../components/PaginationControls.tsx';
import {
  createNavPlan,
  deleteNavPlan,
  getNavAuditoriesByTypeId,
  getNavCampuses,
  getNavFloors,
  getNavPlans,
  getNavTypes,
  updateNavPlansBatch,
  getPlanSvg,
  uploadPlanSvg,
  type NavAuditory,
  type NavCampus,
  type NavFloor,
  type NavPlan,
  type NavPlanCreateInput,
  type NavPlanUpdateInput,
} from '../api';

// ID типов аудиторий из GraphQL схемы
const WC_MAN_TYPE_ID = 12;
const WC_WOMAN_TYPE_ID = 19;
const WC_SHARED_TYPE_ID = 14;
const ENTRANCE_TYPE_ID = 13;

interface EditableRow {
  key: string;
  serverId: number | null;
  idSys: string;
  corId: number | null;
  floorId: number | null;
  ready: boolean;
  entrancesJson: string;
  graphJson: string;
  svgId: number | null;
  nearestEntrance: string | null;
  nearestManWc: string | null;
  nearestWomanWc: string | null;
  nearestSharedWc: string | null;
}

function fromApi(plan: NavPlan): EditableRow {
  return {
    key: `s-${plan.id}`,
    serverId: plan.id,
    idSys: plan.idSys,
    corId: plan.corId,
    floorId: plan.floorId,
    ready: plan.ready,
    entrancesJson: plan.entrances ?? '[]',
    graphJson: plan.graph ?? '[]',
    svgId: plan.svgId,
    nearestEntrance: plan.nearestEntrance,
    nearestManWc: plan.nearestManWc,
    nearestWomanWc: plan.nearestWomanWc,
    nearestSharedWc: plan.nearestSharedWc,
  };
}

function emptyNewRow(key: string): EditableRow {
  return {
    key,
    serverId: null,
    idSys: '',
    corId: null,
    floorId: null,
    ready: true,
    entrancesJson: '[]',
    graphJson: '[]',
    svgId: null,
    nearestEntrance: null,
    nearestManWc: null,
    nearestWomanWc: null,
    nearestSharedWc: null,
  };
}

function cloneRow(r: EditableRow): EditableRow {
  return { ...r };
}

function diffRow(init: EditableRow, cur: EditableRow): NavPlanUpdateInput | null {
  const d: NavPlanUpdateInput = {};
  if (init.idSys !== cur.idSys) d.idSys = cur.idSys;
  if (init.corId !== cur.corId) d.corId = cur.corId ?? undefined;
  if (init.floorId !== cur.floorId) d.floorId = cur.floorId ?? undefined;
  if (init.ready !== cur.ready) d.ready = cur.ready;
  if (init.entrancesJson !== cur.entrancesJson) d.entrances = cur.entrancesJson;
  if (init.graphJson !== cur.graphJson) d.graph = cur.graphJson;
  if (init.svgId !== cur.svgId) d.svgId = cur.svgId ?? undefined;
  if (init.nearestEntrance !== cur.nearestEntrance) d.nearestEntrance = cur.nearestEntrance;
  if (init.nearestManWc !== cur.nearestManWc) d.nearestManWc = cur.nearestManWc;
  if (init.nearestWomanWc !== cur.nearestWomanWc) d.nearestWomanWc = cur.nearestWomanWc;
  if (init.nearestSharedWc !== cur.nearestSharedWc) d.nearestSharedWc = cur.nearestSharedWc;
  return Object.keys(d).length > 0 ? d : null;
}

function serializeState(rows: EditableRow[], pendingDeleteIds: number[]): string {
  return JSON.stringify({
    rows: rows.map((r) => ({
      k: r.key,
      sid: r.serverId,
      idSys: r.idSys,
      corId: r.corId,
      floorId: r.floorId,
      ready: r.ready,
      ej: r.entrancesJson,
      gj: r.graphJson,
      svgId: r.svgId,
      ne: r.nearestEntrance,
      nm: r.nearestManWc,
      nw: r.nearestWomanWc,
      ns: r.nearestSharedWc,
    })),
    pd: [...pendingDeleteIds].sort((a, b) => a - b),
  });
}

const DEFAULT_PAGE_SIZE = 20;

function NavPlansPage() {
  const { token, user, loading: authLoading } = useAuth();
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

  const [campuses, setCampuses] = useState<NavCampus[]>([]);
  const [floors, setFloors] = useState<NavFloor[]>([]);
  const [entrances, setEntrances] = useState<NavAuditory[]>([]);
  const [wcMan, setWcMan] = useState<NavAuditory[]>([]);
  const [wcWoman, setWcWoman] = useState<NavAuditory[]>([]);
  const [wcShared, setWcShared] = useState<NavAuditory[]>([]);

  const [entrancesModal, setEntrancesModal] = useState<{
    rowKey: string;
    draft: string;
  } | null>(null);

  const [graphModal, setGraphModal] = useState<{
    rowKey: string;
    draft: string;
  } | null>(null);

  const [svgModal, setSvgModal] = useState<{
    rowKey: string;
    svgUrl: string | null;
    file: File | null;
    zoom?: number;
  } | null>(null);

  // Пагинация
  const [currentPage, setCurrentPage] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);

  const loadData = useCallback(async () => {
    if (!token) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);

    const filters: Record<string, unknown> = {};
    if (appliedId.trim() !== '') {
      const idNum = parseInt(appliedId.trim(), 10);
      if (!Number.isNaN(idNum)) filters.id = idNum;
    }
    if (appliedIdSys.trim() !== '') filters.idSys = appliedIdSys.trim();

    const offset = (currentPage - 1) * pageSize;

    const {
      plans,
      pagination,
      error: planErr,
    } = await getNavPlans(token, Object.keys(filters).length > 0 ? filters : undefined, {
      limit: pageSize,
      offset,
    });

    if (planErr) {
      setError(planErr);
      setRows([]);
      setInitialById(new Map());
      setBaseline('');
      setPendingDeleteIds([]);
      setLoading(false);
      return;
    }

    setTotalItems(pagination?.totalCount ?? 0);

    const nextRows = plans.map(fromApi);
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
  }, [token, appliedId, appliedIdSys, pageSize, currentPage]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  useEffect(() => {
    if (!token) return;
    let cancelled = false;

    void (async () => {
      const [
        { campuses: campusesItems, error: cErr }, // ✅ ИСПРАВЛЕНО: items -> campuses
        { floors: floorsItems, error: fErr },
        { items: types, error: tErr },
      ] = await Promise.all([
        getNavCampuses(token, undefined, { limit: 100 }),
        getNavFloors(token, { limit: 50 }),
        getNavTypes(token, 50), // ✅ ИСПРАВЛЕНО: 50 -> { limit: 50 }
      ]);

      if (cancelled) return;
      if (!cErr) setCampuses(campusesItems);
      if (!fErr) setFloors(floorsItems);
      if (tErr) return;

      // Находим ID типов по названиям
      const entranceType = types.find((x) => x.id === ENTRANCE_TYPE_ID);
      const manWcType = types.find((x) => x.id === WC_MAN_TYPE_ID);
      const womanWcType = types.find((x) => x.id === WC_WOMAN_TYPE_ID);
      const sharedWcType = types.find((x) => x.id === WC_SHARED_TYPE_ID);

      const [
        { items: entranceItems, error: eErr },
        { items: manItems, error: mErr },
        { items: womanItems, error: wErr },
        { items: sharedItems, error: sErr },
      ] = await Promise.all([
        entranceType
          ? getNavAuditoriesByTypeId(token, entranceType.id, 200)
          : Promise.resolve({ items: [], error: null }),
        manWcType
          ? getNavAuditoriesByTypeId(token, manWcType.id, 200)
          : Promise.resolve({ items: [], error: null }),
        womanWcType
          ? getNavAuditoriesByTypeId(token, womanWcType.id, 200)
          : Promise.resolve({ items: [], error: null }),
        sharedWcType
          ? getNavAuditoriesByTypeId(token, sharedWcType.id, 200)
          : Promise.resolve({ items: [], error: null }),
      ]);

      if (cancelled) return;
      if (!eErr) setEntrances(entranceItems);
      if (!mErr) setWcMan(manItems);
      if (!wErr) setWcWoman(womanItems);
      if (!sErr) setWcShared(sharedItems);
    })();

    return () => {
      cancelled = true;
    };
  }, [token]);

  const dirty = useMemo(() => {
    return serializeState(rows, pendingDeleteIds) !== baseline;
  }, [rows, pendingDeleteIds, baseline]);

  const handleApplyFilters = () => {
    setCurrentPage(1);
    setAppliedId(filterId);
    setAppliedIdSys(filterIdSys);
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

  const openEntrances = (row: EditableRow) => {
    setEntrancesModal({ rowKey: row.key, draft: row.entrancesJson });
  };

  const applyEntrancesModal = () => {
    if (!entrancesModal) return;
    updateRow(entrancesModal.rowKey, { entrancesJson: entrancesModal.draft });
    setEntrancesModal(null);
  };

  const openGraph = (row: EditableRow) => {
    setGraphModal({ rowKey: row.key, draft: row.graphJson });
  };

  const applyGraphModal = () => {
    if (!graphModal) return;
    updateRow(graphModal.rowKey, { graphJson: graphModal.draft });
    setGraphModal(null);
  };

  const openSvg = (row: EditableRow) => {
    if (row.svgId && token) {
      void (async () => {
        const { svg, error } = await getPlanSvg(token, row.idSys);
        if (!error && svg) {
          const url = URL.createObjectURL(svg);
          setSvgModal({ rowKey: row.key, svgUrl: url, file: null, zoom: 1 }); // ✅ Сброс зума на 1
        } else {
          setSvgModal({ rowKey: row.key, svgUrl: null, file: null, zoom: 1 });
        }
      })();
    } else {
      setSvgModal({ rowKey: row.key, svgUrl: null, file: null, zoom: 1 });
    }
  };

  const applySvgModal = async () => {
    if (!svgModal || !token) return;

    const row = rows.find((r) => r.key === svgModal.rowKey);
    if (!row?.idSys) {
      setError('Не выбран план для загрузки');
      return;
    }

    if (svgModal.file) {
      const { ok, error } = await uploadPlanSvg(token, row.idSys, svgModal.file);
      if (!ok) {
        setError(error ?? 'Ошибка загрузки SVG');
        return;
      }
    }

    if (svgModal.svgUrl?.startsWith('blob:')) {
      URL.revokeObjectURL(svgModal.svgUrl);
    }

    setSvgModal(null);
    await loadData();
  };

  useEffect(() => {
    return () => {
      if (svgModal?.svgUrl?.startsWith('blob:')) {
        URL.revokeObjectURL(svgModal.svgUrl);
      }
    };
  }, [svgModal]);

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
    if (!token) return;
    setSaving(true);
    setNotice(null);
    setError(null);

    try {
      for (const id of pendingDeleteIds) {
        const { error: delErr } = await deleteNavPlan(token, id);
        if (delErr) {
          setError(delErr);
          setSaving(false);
          return;
        }
      }

      const creates = rows.filter((r) => r.serverId == null);
      for (const r of creates) {
        if (r.corId == null || r.floorId == null) {
          setError('Необходимо выбрать кампус и этаж');
          setSaving(false);
          return;
        }
        const data: NavPlanCreateInput = {
          idSys: r.idSys,
          corId: r.corId,
          floorId: r.floorId,
          ready: r.ready,
          // entrances: r.entrancesJson,
          // graph: r.graphJson,
          // svgId: r.svgId,
          nearestEntrance: r.nearestEntrance,
          nearestManWc: r.nearestManWc,
          nearestWomanWc: r.nearestWomanWc,
          nearestSharedWc: r.nearestSharedWc,
        };
        const { error: cErr } = await createNavPlan(token, data);
        if (cErr) {
          setError(cErr);
          setSaving(false);
          return;
        }
      }

      const updates: Array<{ id: number; data: NavPlanUpdateInput }> = [];
      for (const r of rows) {
        if (r.serverId == null) continue;
        const init = initialById.get(r.serverId);
        if (!init) continue;
        const d = diffRow(init, r);
        if (d) updates.push({ id: r.serverId, data: d });
      }

      if (updates.length > 0) {
        const { error: uErr } = await updateNavPlansBatch(token, updates);
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

  const getCampusName = (corId: number | null): string => {
    if (corId == null) return '—';
    const campus = campuses.find((c) => c.id === corId);
    return campus?.name ?? `ID: ${corId}`;
  };

  const getFloorName = (floorId: number | null): string => {
    if (floorId == null) return '—';
    const floor = floors.find((f) => f.id === floorId);
    return floor ? `Этаж ${floor.name}` : `ID: ${floorId}`;
  };

  const totalPages = useMemo(() => {
    if (totalItems === 0) return 1;
    return Math.ceil(totalItems / pageSize);
  }, [totalItems, pageSize]);

  if (authLoading) {
    return (
      <RequirePermission goal="nav_data" right="view">
        <Page headerText="Редактирование планов навигации">
          <LinearProgress />
        </Page>
      </RequirePermission>
    );
  }

  return (
    <RequirePermission goal="nav_data" right="view">
      <Page headerText="Редактирование планов навигации">
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
              <Typography level="h4">Планы навигации</Typography>
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
                  Нет планов по текущим фильтрам
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
                  minWidth: 1400,
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
                    <th style={{ padding: '12px', width: 150 }}>Кампус</th>
                    <th style={{ padding: '12px', width: 100 }}>Этаж</th>
                    <th style={{ padding: '12px', width: 80 }}>ready</th>
                    <th style={{ padding: '12px', width: 100 }}>Входы</th>
                    <th style={{ padding: '12px', width: 100 }}>Граф</th>
                    <th style={{ padding: '12px', width: 100 }}>SVG</th>
                    <th style={{ padding: '12px', width: 120 }}>Вход (ближ.)</th>
                    <th style={{ padding: '12px', width: 120 }}>Туалет М (ближ.)</th>
                    <th style={{ padding: '12px', width: 120 }}>Туалет Ж (ближ.)</th>
                    <th style={{ padding: '12px', width: 120 }}>Туалет Общий (ближ.)</th>
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
                        {canEdit ? (
                          <Select
                            size="sm"
                            value={row.corId ?? undefined}
                            onChange={(_, v) => updateRow(row.key, { corId: v ?? null })}
                            placeholder="Кампус"
                            sx={{ minWidth: 150, maxWidth: 150 }}
                          >
                            {campuses.map((c) => (
                              <Option key={c.id} value={c.id}>
                                {c.name}
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
                            title={getCampusName(row.corId)}
                          >
                            {getCampusName(row.corId)}
                          </Typography>
                        )}
                      </td>
                      <td style={{ padding: '12px', verticalAlign: 'middle' }}>
                        {canEdit ? (
                          <Select
                            size="sm"
                            value={row.floorId ?? undefined}
                            onChange={(_, v) => updateRow(row.key, { floorId: v ?? null })}
                            placeholder="Этаж"
                            sx={{ minWidth: 100, maxWidth: 100 }}
                          >
                            {floors.map((f) => (
                              <Option key={f.id} value={f.id}>
                                {f.name}
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
                            title={getFloorName(row.floorId)}
                          >
                            {getFloorName(row.floorId)}
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
                        <IconButton
                          size="sm"
                          color="primary"
                          variant={row.entrancesJson === '[]' ? 'outlined' : 'solid'}
                          onClick={() => openEntrances(row)}
                          disabled={!canEdit}
                          title="Редактировать входы"
                        >
                          <DoorFront fontSize="small" />
                        </IconButton>
                      </td>
                      <td style={{ padding: '12px', verticalAlign: 'middle' }}>
                        <IconButton
                          size="sm"
                          color="primary"
                          variant={row.graphJson === '[]' ? 'outlined' : 'solid'}
                          onClick={() => openGraph(row)}
                          disabled={!canEdit}
                          title="Редактировать граф"
                        >
                          <Edit fontSize="small" />
                        </IconButton>
                      </td>
                      <td style={{ padding: '12px', verticalAlign: 'middle' }}>
                        <IconButton
                          size="sm"
                          color={row.svgId ? 'success' : 'primary'}
                          variant={row.svgId ? 'solid' : 'outlined'}
                          onClick={() => openSvg(row)}
                          title={row.svgId ? 'Просмотреть/заменить SVG' : 'Загрузить SVG'}
                        >
                          {row.svgId ? (
                            <Visibility fontSize="small" />
                          ) : (
                            <Upload fontSize="small" />
                          )}
                        </IconButton>
                      </td>
                      <td style={{ padding: '12px', verticalAlign: 'middle' }}>
                        {canEdit ? (
                          <Select
                            size="sm"
                            value={row.nearestEntrance ?? undefined}
                            onChange={(_, v) => updateRow(row.key, { nearestEntrance: v ?? null })}
                            placeholder="Вход"
                            sx={{ minWidth: 120, maxWidth: 120 }}
                          >
                            {entrances.map((e) => (
                              <Option key={e.id} value={e.idSys}>
                                {e.idSys}
                              </Option>
                            ))}
                          </Select>
                        ) : (
                          <Typography level="body-sm">{row.nearestEntrance ?? '—'}</Typography>
                        )}
                      </td>
                      <td style={{ padding: '12px', verticalAlign: 'middle' }}>
                        {canEdit ? (
                          <Select
                            size="sm"
                            value={row.nearestManWc ?? undefined}
                            onChange={(_, v) => updateRow(row.key, { nearestManWc: v ?? null })}
                            placeholder="Туалет М"
                            sx={{ minWidth: 120, maxWidth: 120 }}
                            startDecorator={<Wc fontSize="small" />}
                          >
                            {wcMan.map((w) => (
                              <Option key={w.id} value={w.idSys}>
                                {w.idSys}
                              </Option>
                            ))}
                          </Select>
                        ) : (
                          <Typography level="body-sm">{row.nearestManWc ?? '—'}</Typography>
                        )}
                      </td>
                      <td style={{ padding: '12px', verticalAlign: 'middle' }}>
                        {canEdit ? (
                          <Select
                            size="sm"
                            value={row.nearestWomanWc ?? undefined}
                            onChange={(_, v) => updateRow(row.key, { nearestWomanWc: v ?? null })}
                            placeholder="Туалет Ж"
                            sx={{ minWidth: 120, maxWidth: 120 }}
                            startDecorator={<Wc fontSize="small" />}
                          >
                            {wcWoman.map((w) => (
                              <Option key={w.id} value={w.idSys}>
                                {w.idSys}
                              </Option>
                            ))}
                          </Select>
                        ) : (
                          <Typography level="body-sm">{row.nearestWomanWc ?? '—'}</Typography>
                        )}
                      </td>
                      <td style={{ padding: '12px', verticalAlign: 'middle' }}>
                        {canEdit ? (
                          <Select
                            size="sm"
                            value={row.nearestSharedWc ?? undefined}
                            onChange={(_, v) => updateRow(row.key, { nearestSharedWc: v ?? null })}
                            placeholder="Туалет Общий"
                            sx={{ minWidth: 120, maxWidth: 120 }}
                            startDecorator={<Wc fontSize="small" />}
                          >
                            {wcShared.map((w) => (
                              <Option key={w.id} value={w.idSys}>
                                {w.idSys}
                              </Option>
                            ))}
                          </Select>
                        ) : (
                          <Typography level="body-sm">{row.nearestSharedWc ?? '—'}</Typography>
                        )}
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

      {/* Модальное окно входов */}
      <Modal open={!!entrancesModal} onClose={() => setEntrancesModal(null)}>
        <ModalDialog sx={{ minWidth: 480, maxWidth: 'min(96vw, 720px)' }}>
          <ModalClose />
          <Typography level="h4">Входы (JSON)</Typography>
          <Divider sx={{ my: 2 }} />
          <Typography level="body-sm" color="neutral" sx={{ mb: 2 }}>
            Формат: массив массивов [idSys, расстояние]
          </Typography>
          <Textarea
            minRows={8}
            value={entrancesModal?.draft ?? ''}
            onChange={(e) => setEntrancesModal((m) => (m ? { ...m, draft: e.target.value } : m))}
            sx={{ fontFamily: 'monospace' }}
          />
          <Stack direction="row" spacing={1} sx={{ mt: 2, justifyContent: 'flex-end' }}>
            <Button variant="outlined" onClick={() => setEntrancesModal(null)}>
              Отмена
            </Button>
            <Button variant="solid" color="primary" onClick={applyEntrancesModal}>
              Ок
            </Button>
          </Stack>
        </ModalDialog>
      </Modal>

      {/* Модальное окно графа */}
      <Modal open={!!graphModal} onClose={() => setGraphModal(null)}>
        <ModalDialog sx={{ minWidth: 480, maxWidth: 'min(96vw, 720px)' }}>
          <ModalClose />
          <Typography level="h4">Граф навигации (JSON)</Typography>
          <Divider sx={{ my: 2 }} />
          <Typography level="body-sm" color="neutral" sx={{ mb: 2 }}>
            JSON массив вершин графа
          </Typography>
          <Textarea
            minRows={12}
            value={graphModal?.draft ?? ''}
            onChange={(e) => setGraphModal((m) => (m ? { ...m, draft: e.target.value } : m))}
            sx={{ fontFamily: 'monospace' }}
          />
          <Stack direction="row" spacing={1} sx={{ mt: 2, justifyContent: 'flex-end' }}>
            <Button variant="outlined" onClick={() => setGraphModal(null)}>
              Отмена
            </Button>
            <Button variant="solid" color="primary" onClick={applyGraphModal}>
              Ок
            </Button>
          </Stack>
        </ModalDialog>
      </Modal>

      {/* Модальное окно SVG */}
      <Modal open={!!svgModal} onClose={() => setSvgModal(null)}>
        <ModalDialog
          sx={{
            minWidth: 480,
            maxWidth: 'min(96vw, 800px)',
            maxHeight: '70vh',
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          <ModalClose />
          <Typography level="h4">SVG план</Typography>
          <Divider sx={{ my: 2 }} />

          <Stack spacing={2} sx={{ flex: 1, minHeight: 0 }}>
            {/* Панель управления зумом */}
            {svgModal?.svgUrl && (
              <Box sx={{ display: 'flex', gap: 1, justifyContent: 'center', alignItems: 'center' }}>
                <IconButton
                  size="sm"
                  variant="outlined"
                  onClick={() =>
                    setSvgModal((m) =>
                      m ? { ...m, zoom: Math.max(0.1, (m.zoom ?? 1) - 0.25) } : m
                    )
                  }
                  title="Уменьшить"
                >
                  –
                </IconButton>

                <Typography level="body-sm" sx={{ minWidth: 60, textAlign: 'center' }}>
                  {Math.round((svgModal.zoom ?? 1) * 100)}%
                </Typography>

                <IconButton
                  size="sm"
                  variant="outlined"
                  onClick={() =>
                    setSvgModal((m) => (m ? { ...m, zoom: Math.min(3, (m.zoom ?? 1) + 0.25) } : m))
                  }
                  title="Увеличить"
                >
                  +
                </IconButton>

                <IconButton
                  size="sm"
                  variant="soft"
                  color="neutral"
                  onClick={() => setSvgModal((m) => (m ? { ...m, zoom: 1 } : m))}
                  title="Сбросить масштаб"
                >
                  ↺
                </IconButton>
              </Box>
            )}

            {/* Область просмотра SVG с зумом */}
            <Box
              sx={{
                flex: 1,
                overflow: 'auto',
                border: '1px solid var(--joy-palette-neutral-300)',
                borderRadius: 'sm',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: 'var(--joy-palette-background-surface)',
                '&:hover': {
                  '& .svg-zoom-container': {
                    cursor: svgModal?.svgUrl ? 'grab' : 'default',
                  },
                },
                '&:active': {
                  '& .svg-zoom-container': {
                    cursor: 'grabbing',
                  },
                },
              }}
              onWheel={(e) => {
                // Зум колесом мыши (опционально)
                if (svgModal?.svgUrl && e.ctrlKey) {
                  e.preventDefault();
                  setSvgModal((m) => {
                    if (!m) return m;
                    const delta = e.deltaY > 0 ? -0.25 : 0.25;
                    return { ...m, zoom: Math.max(0.5, Math.min(3, (m.zoom ?? 1) + delta)) };
                  });
                }
              }}
            >
              {svgModal?.svgUrl ? (
                <Box
                  className="svg-zoom-container"
                  sx={{
                    transform: `scale(${svgModal.zoom ?? 1})`,
                    transformOrigin: 'center center',
                    transition: 'transform 0.15s ease-out',
                    willChange: 'transform',
                  }}
                >
                  <img
                    src={svgModal.svgUrl}
                    alt="Plan SVG"
                    style={{
                      maxWidth: 'none',
                      maxHeight: 'none',
                      display: 'block',
                      userSelect: 'none',
                      pointerEvents: 'none',
                    }}
                    draggable={false}
                  />
                </Box>
              ) : (
                <Box
                  sx={{
                    p: 4,
                    textAlign: 'center',
                    border: '2px dashed var(--joy-palette-neutral-300)',
                    borderRadius: 'sm',
                    width: '100%',
                    height: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Typography level="body-sm" color="neutral">
                    SVG план ещё не загружен
                  </Typography>
                </Box>
              )}
            </Box>

            {/* Загрузка нового файла */}
            <FormControl>
              <FormLabel>Загрузить новый SVG</FormLabel>
              <input
                type="file"
                accept=".svg"
                onChange={(e) =>
                  setSvgModal((m) => (m ? { ...m, file: e.target.files?.[0] ?? null } : m))
                }
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  border: '1px solid var(--joy-palette-neutral-300)',
                  borderRadius: 'var(--joy-radius-sm)',
                  backgroundColor: 'var(--joy-palette-background-surface)',
                  color: 'var(--joy-palette-text-primary)',
                  cursor: 'pointer',
                  fontSize: 'var(--joy-fontSize-sm)',
                }}
              />
            </FormControl>
          </Stack>

          {/* Кнопки подтверждения */}
          <Stack direction="row" spacing={1} sx={{ mt: 2, justifyContent: 'flex-end' }}>
            <Button variant="outlined" onClick={() => setSvgModal(null)}>
              Отмена
            </Button>
            <Button variant="solid" color="primary" onClick={applySvgModal}>
              Ок
            </Button>
          </Stack>
        </ModalDialog>
      </Modal>
    </RequirePermission>
  );
}

export default NavPlansPage;

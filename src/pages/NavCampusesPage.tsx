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
  Stairs,
} from '@mui/icons-material';
import Page from '../components/Page.tsx';
import { RequirePermission } from '../components/RequirePermission.tsx';
import { useAuth } from '../hooks/useAuth.ts';
import PaginationControls from '../components/PaginationControls.tsx';
import {
  createNavCampus,
  deleteNavCampus,
  getNavAuditoriesByTypeId,
  getNavCampuses,
  getNavLocations,
  getNavTypes,
  updateNavCampusesBatch,
  type NavAuditory,
  type NavCampus,
  type NavCampusCreateInput,
  type NavCampusUpdateInput,
  type NavLocation,
} from '../api';

type StairGroup = string[];

function parseStairGroups(raw: string | null | undefined): StairGroup[] {
  if (raw == null || raw === '') return [];
  try {
    const v = JSON.parse(raw) as unknown;
    if (!Array.isArray(v)) return [];
    const out: StairGroup[] = [];
    for (const item of v) {
      if (!Array.isArray(item)) continue;
      const group = item.map((s) => String(s)).filter((s) => s.trim() !== '');
      if (group.length > 0) out.push(group);
    }
    return out;
  } catch {
    return [];
  }
}

function stairGroupsToJson(groups: StairGroup[]): string {
  return JSON.stringify(groups);
}

interface EditableRow {
  key: string;
  serverId: number | null;
  idSys: string;
  locId: number | null;
  name: string;
  ready: boolean;
  stairGroupsJson: string;
  comments: string | null;
}

function fromApi(campus: NavCampus): EditableRow {
  const stairGroups =
    campus.stairGroups != null && String(campus.stairGroups).trim() !== ''
      ? String(campus.stairGroups)
      : '[]';
  return {
    key: `s-${campus.id}`,
    serverId: campus.id,
    idSys: campus.idSys,
    locId: campus.locId,
    name: campus.name,
    ready: campus.ready,
    stairGroupsJson: stairGroups,
    comments: campus.comments,
  };
}

function emptyNewRow(key: string): EditableRow {
  return {
    key,
    serverId: null,
    idSys: '',
    locId: null,
    name: '',
    ready: true,
    stairGroupsJson: '[]',
    comments: null,
  };
}

function cloneRow(r: EditableRow): EditableRow {
  return { ...r };
}

function diffRow(init: EditableRow, cur: EditableRow): NavCampusUpdateInput | null {
  const d: NavCampusUpdateInput = {};
  if (init.idSys !== cur.idSys) d.idSys = cur.idSys;
  if (init.locId !== cur.locId) d.locId = cur.locId ?? undefined;
  if (init.name !== cur.name) d.name = cur.name;
  if (init.ready !== cur.ready) d.ready = cur.ready;
  if (init.comments !== cur.comments) d.comments = cur.comments;
  // if (init.stairGroupsJson !== cur.stairGroupsJson) d.stairGroups = cur.stairGroupsJson;
  return Object.keys(d).length > 0 ? d : null;
}

function serializeState(rows: EditableRow[], pendingDeleteIds: number[]): string {
  return JSON.stringify({
    rows: rows.map((r) => ({
      k: r.key,
      sid: r.serverId,
      idSys: r.idSys,
      locId: r.locId,
      name: r.name,
      ready: r.ready,
      sg: r.stairGroupsJson,
      c: r.comments,
    })),
    pd: [...pendingDeleteIds].sort((a, b) => a - b),
  });
}

const DEFAULT_PAGE_SIZE = 10;

function NavCampusesPage() {
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

  const [locations, setLocations] = useState<NavLocation[]>([]);
  const [stairs, setStairs] = useState<NavAuditory[]>([]);

  const [commentsModal, setCommentsModal] = useState<{
    rowKey: string;
    draft: string;
  } | null>(null);

  const [stairsModal, setStairsModal] = useState<{
    rowKey: string;
    groups: StairGroup[];
  } | null>(null);

  // Пагинация
  const [currentPage, setCurrentPage] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);

  // Отдельный эффект для загрузки данных при изменении пагинации/фильтров
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
      campuses,
      pagination,
      error: campErr,
    } = await getNavCampuses(Object.keys(filters).length > 0 ? filters : undefined, {
      limit: pageSize,
      offset,
    });

    if (campErr) {
      setError(campErr);
      setRows([]);
      setInitialById(new Map());
      setBaseline('');
      setPendingDeleteIds([]);
      setLoading(false);
      return;
    }

    setTotalItems(pagination?.totalCount ?? 0);

    const nextRows = campuses.map(fromApi);
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

  // Загрузка данных при изменении пагинации или фильтров
  useEffect(() => {
    void loadData();
  }, [loadData]);

  // Загрузка справочников (локации, типы, лестницы) — только при авторизации
  useEffect(() => {
    let cancelled = false;

    void (async () => {
      const { items: types, error: tErr } = await getNavTypes(50);
      if (cancelled || tErr) return;

      const stairType = types.find((x) => /лестниц/i.test(x.name)) ?? types.find((x) => x.id === 3);
      const stairTypeId = stairType?.id ?? 3;

      const [{ items: stairsItems, error: sErr }, { locations: locs, error: lErr }] =
        await Promise.all([getNavAuditoriesByTypeId(stairTypeId, 200), getNavLocations(undefined)]);

      if (cancelled) return;
      if (!sErr) setStairs(stairsItems);
      if (!lErr) setLocations(locs);
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  const dirty = useMemo(() => {
    return serializeState(rows, pendingDeleteIds) !== baseline;
  }, [rows, pendingDeleteIds, baseline]);

  const handleApplyFilters = () => {
    setCurrentPage(1); // Сброс на первую страницу при применении фильтров
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
      setCurrentPage(1); // Сброс на первую страницу при смене размера
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

  const openComments = (row: EditableRow) => {
    setCommentsModal({ rowKey: row.key, draft: row.comments ?? '' });
  };

  const applyCommentsModal = () => {
    if (!commentsModal) return;
    updateRow(commentsModal.rowKey, { comments: commentsModal.draft });
    setCommentsModal(null);
  };

  const openStairs = (row: EditableRow) => {
    setStairsModal({
      rowKey: row.key,
      groups: parseStairGroups(row.stairGroupsJson),
    });
  };

  const applyStairsModal = () => {
    if (!stairsModal) return;
    updateRow(stairsModal.rowKey, { stairGroupsJson: stairGroupsToJson(stairsModal.groups) });
    setStairsModal(null);
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
        const { error: delErr } = await deleteNavCampus(id);
        if (delErr) {
          setError(delErr);
          setSaving(false);
          return;
        }
      }

      const creates = rows.filter((r) => r.serverId == null);
      for (const r of creates) {
        if (r.locId == null) {
          setError('Необходимо выбрать локацию');
          setSaving(false);
          return;
        }
        // ИСПРАВЛЕНИЕ: правильно объявляем переменную с типом
        const data: NavCampusCreateInput = {
          idSys: r.idSys,
          locId: r.locId,
          name: r.name,
          ready: r.ready,
          comments: r.comments,
          stairGroups: r.stairGroupsJson,
        };
        const { error: cErr } = await createNavCampus(data);
        if (cErr) {
          setError(cErr);
          setSaving(false);
          return;
        }
      }

      // 3. Обновляем существующие записи
      const updates: Array<{ id: number; data: NavCampusUpdateInput }> = [];
      for (const r of rows) {
        if (r.serverId == null) continue;
        const init = initialById.get(r.serverId);
        if (!init) continue;
        const d = diffRow(init, r);
        if (d) {
          // ИСПРАВЛЕНИЕ: правильно называем свойство 'data'
          updates.push({ id: r.serverId, data: d });
        }
      }

      if (updates.length > 0) {
        const { error: uErr } = await updateNavCampusesBatch(updates);
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

  const stairsActionTitle = (sg: string) => {
    const g = parseStairGroups(sg);
    return g.length === 0 ? 'Добавить группы лестниц' : 'Редактировать группы лестниц';
  };

  const getLocationName = (locId: number | null): string => {
    if (locId == null) return '—';
    const loc = locations.find((l) => l.id === locId);
    return loc?.name ?? `ID: ${locId}`;
  };

  const totalPages = useMemo(() => {
    if (totalItems === 0) return 1;
    return Math.ceil(totalItems / pageSize);
  }, [totalItems, pageSize]);

  if (authLoading) {
    return (
      <RequirePermission goal="nav_data" right="view">
        <Page headerText="Редактирование корпусов кампуса">
          <LinearProgress />
        </Page>
      </RequirePermission>
    );
  }

  return (
    <RequirePermission goal="nav_data" right="view">
      <Page headerText="Редактирование корпусов кампуса">
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
              <Typography level="h4">Корпуса кампуса</Typography>
              {!loading && rows.length > 0 && (
                <Chip size="sm" variant="soft" color="neutral">
                  {rows.length} записей
                </Chip>
              )}
            </Stack>

            {/* Правая часть: элементы управления — селектор выровнен в одну линию */}
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
                  />
                </FormControl>
                <FormControl sx={{ minWidth: 200, flex: { sm: '1 1 200px' } }}>
                  <FormLabel>Фильтр по названию</FormLabel>
                  <Input
                    value={filterName}
                    onChange={(e) => setFilterName(e.target.value)}
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
                  Нет корпусов по текущим фильтрам
                </Typography>
                <Typography level="body-sm" sx={{ mt: 1 }}>
                  Смените фильтры или нажмите «Добавить строку»
                </Typography>
              </Box>
            </Card>
          ) : (
            // Таблица с горизонтальной прокруткой
            <Sheet
              variant="outlined"
              sx={{
                borderRadius: 'sm',
                overflowX: 'auto',
                overflowY: 'hidden',
                '& table': {
                  tableLayout: 'fixed', // Фиксированная ширина колонок
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
                    maxWidth: 0, // Позволяет наследовать ширину от table-layout: fixed
                  },
                }}
              >
                <thead>
                  <tr>
                    <th style={{ padding: '12px', width: 60, minWidth: 60 }}>id</th>
                    <th style={{ padding: '12px', width: 120, minWidth: 120 }}>idSys</th>
                    <th style={{ padding: '12px', width: 200, minWidth: 200 }}>Локация</th>
                    <th style={{ padding: '12px', width: 180, minWidth: 180 }}>Название</th>
                    <th style={{ padding: '12px', width: 80, minWidth: 80 }}>ready</th>
                    <th style={{ padding: '12px', width: 150, minWidth: 150 }}>Группы лестниц</th>
                    <th style={{ padding: '12px', width: 120, minWidth: 120 }}>Комментарий</th>
                    <th style={{ padding: '12px', width: 56, minWidth: 56, textAlign: 'right' }} />
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
                          sx={{
                            maxWidth: '100%',
                            '& input': {
                              textOverflow: 'ellipsis',
                            },
                          }}
                        />
                      </td>
                      <td style={{ padding: '12px', verticalAlign: 'middle' }}>
                        {canEdit ? (
                          <Select
                            size="sm"
                            value={row.locId ?? undefined}
                            onChange={(_, v) => updateRow(row.key, { locId: v ?? null })}
                            placeholder="Выберите локацию"
                            sx={{
                              minWidth: 200,
                              maxWidth: 200,
                              '& .JoySelect-value': {
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                              },
                            }}
                          >
                            {locations.map((loc) => (
                              <Option key={loc.id} value={loc.id}>
                                {loc.name}
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
                            title={getLocationName(row.locId)} // Tooltip с полным текстом
                          >
                            {getLocationName(row.locId)}
                          </Typography>
                        )}
                      </td>
                      <td style={{ padding: '12px', verticalAlign: 'middle' }}>
                        <Input
                          size="sm"
                          value={row.name}
                          onChange={(e) => updateRow(row.key, { name: e.target.value })}
                          disabled={!canEdit}
                          sx={{
                            maxWidth: '100%',
                            '& input': {
                              textOverflow: 'ellipsis',
                            },
                          }}
                        />
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
                        <Stack direction="row" spacing={1} sx={{ width: 'fit-content' }}>
                          {parseStairGroups(row.stairGroupsJson).length === 0 ? (
                            <IconButton
                              size="sm"
                              color="primary"
                              variant="outlined"
                              onClick={() => openStairs(row)}
                              disabled={!canEdit}
                              title={stairsActionTitle(row.stairGroupsJson)}
                              aria-label={stairsActionTitle(row.stairGroupsJson)}
                            >
                              <Stairs fontSize="small" />
                            </IconButton>
                          ) : (
                            <IconButton
                              size="sm"
                              color="primary"
                              onClick={() => openStairs(row)}
                              disabled={!canEdit}
                              title={stairsActionTitle(row.stairGroupsJson)}
                              aria-label={stairsActionTitle(row.stairGroupsJson)}
                            >
                              <Stairs fontSize="small" />
                            </IconButton>
                          )}
                        </Stack>
                      </td>
                      <td style={{ padding: '12px', verticalAlign: 'middle' }}>
                        <Stack direction="row" spacing={1} sx={{ width: 'fit-content' }}>
                          {row.comments == null || row.comments === '' ? (
                            <IconButton
                              size="sm"
                              color="primary"
                              variant="outlined"
                              onClick={() => openComments(row)}
                              disabled={!canEdit}
                              title={commentsActionTitle(row.comments)}
                              aria-label={commentsActionTitle(row.comments)}
                            >
                              <AddComment fontSize="small" />
                            </IconButton>
                          ) : (
                            <IconButton
                              size="sm"
                              color="primary"
                              onClick={() => openComments(row)}
                              disabled={!canEdit}
                              title={commentsActionTitle(row.comments)}
                              aria-label={commentsActionTitle(row.comments)}
                            >
                              <Comment fontSize="small" />
                            </IconButton>
                          )}
                        </Stack>
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

          {/* Пагинация — показываем только если есть данные и больше одной страницы */}
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

      {/* Модальное окно комментария */}
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

      {/* Модальное окно групп лестниц */}
      {/* Модальное окно групп лестниц */}
      <Modal open={!!stairsModal} onClose={() => setStairsModal(null)}>
        <ModalDialog
          sx={{
            minWidth: 520,
            maxWidth: 'min(96vw, 800px)',
            maxHeight: '70vh', // Ограничение высоты модального окна
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          <ModalClose />
          <Typography level="h4">Группы лестниц</Typography>
          <Divider sx={{ my: 2 }} />

          {/* Фиксированная шапка: описание и кнопки управления группами */}
          <Box sx={{ flexShrink: 0 }}>
            <Typography level="body-sm" color="neutral" sx={{ mb: 2 }}>
              Каждая группа содержит лестницы, соединённые между этажами
            </Typography>
            <Button
              variant="outlined"
              color="neutral"
              size="sm"
              onClick={() =>
                setStairsModal((m) =>
                  m
                    ? {
                        ...m,
                        groups: [...m.groups, ['']],
                      }
                    : m
                )
              }
              sx={{ mb: 2 }}
            >
              Добавить группу
            </Button>
          </Box>

          {/* Скроллируемая область со списком групп */}
          <Box
            sx={{
              flex: 1,
              overflowY: 'auto',
              pr: 1, // Отступ справа, чтобы скролл не наезжал на контент
              '&::-webkit-scrollbar': {
                width: '8px',
              },
              '&::-webkit-scrollbar-track': {
                background: 'transparent',
              },
              '&::-webkit-scrollbar-thumb': {
                background: 'var(--joy-palette-neutral-300)',
                borderRadius: '4px',
              },
              '&::-webkit-scrollbar-thumb:hover': {
                background: 'var(--joy-palette-neutral-400)',
              },
            }}
          >
            <Stack spacing={2}>
              {stairsModal?.groups.map((group, groupIdx) => (
                <Sheet key={groupIdx} variant="outlined" sx={{ p: 2, borderRadius: 'sm' }}>
                  <Stack spacing={1}>
                    <Typography level="body-sm" fontWeight="bold">
                      Группа {groupIdx + 1}
                    </Typography>
                    {group.map((stairIdSys, stairIdx) => (
                      <Stack key={stairIdx} direction="row" spacing={1} alignItems="center">
                        <Select
                          size="sm"
                          value={stairIdSys}
                          onChange={(_, v) =>
                            setStairsModal((m) => {
                              if (!m) return m;
                              const next = m.groups.map((g, i) =>
                                i === groupIdx
                                  ? g.map((s, j) => (j === stairIdx ? (v ?? '') : s))
                                  : g
                              );
                              return { ...m, groups: next };
                            })
                          }
                          placeholder="Выберите лестницу"
                          sx={{ flex: 1 }}
                        >
                          {stairs.map((s) => (
                            <Option key={s.id} value={s.idSys}>
                              {s.idSys}
                            </Option>
                          ))}
                        </Select>
                        <IconButton
                          size="sm"
                          color="danger"
                          onClick={() =>
                            setStairsModal((m) => {
                              if (!m) return m;
                              const next = m.groups.map((g, i) =>
                                i === groupIdx ? g.filter((_, j) => j !== stairIdx) : g
                              );
                              return { ...m, groups: next.filter((g) => g.length > 0) };
                            })
                          }
                        >
                          <DeleteIcon />
                        </IconButton>
                      </Stack>
                    ))}
                    <Button
                      size="sm"
                      variant="outlined"
                      color="neutral"
                      onClick={() =>
                        setStairsModal((m) =>
                          m
                            ? {
                                ...m,
                                groups: m.groups.map((g, i) => (i === groupIdx ? [...g, ''] : g)),
                              }
                            : m
                        )
                      }
                    >
                      Добавить лестницу в группу
                    </Button>
                  </Stack>
                </Sheet>
              ))}
            </Stack>
          </Box>

          {/* Фиксированный футер с кнопками */}
          <Box sx={{ flexShrink: 0, pt: 2 }}>
            <Divider sx={{ mb: 2 }} />
            <Stack direction="row" spacing={1} justifyContent="flex-end">
              <Button variant="outlined" onClick={() => setStairsModal(null)}>
                Отмена
              </Button>
              <Button variant="solid" color="primary" onClick={applyStairsModal}>
                Ок
              </Button>
            </Stack>
          </Box>
        </ModalDialog>
      </Modal>
    </RequirePermission>
  );
}

export default NavCampusesPage;

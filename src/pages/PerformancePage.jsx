import React, { useMemo, useState } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Divider,
  Drawer,
  FormControl,
  Grid,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  TextField,
  Typography
} from '@mui/material';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import { DataGrid } from '@mui/x-data-grid';
import { DatePicker, LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import dayjs from 'dayjs';
import 'dayjs/locale/tr';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from 'recharts';

const STATUS_OPTIONS = [
  { value: 'all', label: 'Tümü' },
  { value: 'pending', label: 'Bekliyor' },
  { value: 'in_progress', label: 'Devam Ediyor' },
  { value: 'paused', label: 'Duraklatıldı' },
  { value: 'done', label: 'Tamamlandı' }
];

const STATUS_MAP = {
  pending: 'bekliyor',
  in_progress: 'devam_ediyor',
  paused: 'duraklatildi',
  done: 'tamamlandi'
};

const formatDate = (value) => {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '-';
  const day = `${date.getDate()}`.padStart(2, '0');
  const month = `${date.getMonth() + 1}`.padStart(2, '0');
  const year = date.getFullYear();
  return `${day}.${month}.${year}`;
};

const hasValue = (data, key = 'value') =>
  Array.isArray(data) && data.some((item) => Number(item[key]) > 0);

const ChartEmpty = () => <div className="chart-empty">Veri yok</div>;

const PerformancePage = ({ tasks = [], influencers = [] }) => {
  const [dateRange, setDateRange] = useState([dayjs().subtract(29, 'day'), dayjs()]);
  const [platform, setPlatform] = useState('all');
  const [status, setStatus] = useState('all');
  const [influencer, setInfluencer] = useState('all');
  const [search, setSearch] = useState('');
  const [drawerTask, setDrawerTask] = useState(null);

  const clearFilters = () => {
    setDateRange([dayjs().subtract(29, 'day'), dayjs()]);
    setPlatform('all');
    setStatus('all');
    setInfluencer('all');
    setSearch('');
  };

  const filteredTasks = useMemo(() => {
    const [start, end] = dateRange;
    return tasks.filter((task) => {
      const taskDate = task.dueDate || task.createdAt;
      const dateValue = taskDate ? dayjs(taskDate) : null;
      if (start && dateValue && dateValue.isBefore(start, 'day')) return false;
      if (end && dateValue && dateValue.isAfter(end, 'day')) return false;
      if (platform !== 'all' && !(task.platforms || []).includes(platform)) return false;
      if (status !== 'all' && task.status !== STATUS_MAP[status]) return false;
      if (influencer !== 'all' && task.influencerName !== influencer) return false;
      return true;
    });
  }, [dateRange, platform, status, influencer, tasks]);

  const searchedTasks = useMemo(() => {
    if (!search) return filteredTasks;
    const term = search.toLowerCase();
    return filteredTasks.filter((task) =>
      [
        task.title,
        task.taskType,
        task.influencerName,
        (task.platforms || []).join(', '),
        task.status
      ]
        .filter(Boolean)
        .some((value) => value.toLowerCase().includes(term))
    );
  }, [filteredTasks, search]);

  const kpi = useMemo(() => {
    const now = new Date();
    const total = filteredTasks.length;
    const done = filteredTasks.filter((task) => task.status === 'tamamlandi').length;
    const inProgress = filteredTasks.filter((task) =>
      ['bekliyor', 'devam_ediyor'].includes(task.status)
    ).length;
    const overdue = filteredTasks.filter(
      (task) => task.dueDate && new Date(task.dueDate) < now && task.status !== 'tamamlandi'
    ).length;
    const completed = filteredTasks
      .filter((task) => task.completedAt && task.createdAt)
      .map((task) => (new Date(task.completedAt) - new Date(task.createdAt)) / (1000 * 60 * 60 * 24));
    const avg = completed.length
      ? Math.round(completed.reduce((sum, value) => sum + value, 0) / completed.length)
      : 0;
    const median = completed.length
      ? Math.round(completed.slice().sort((a, b) => a - b)[Math.floor(completed.length / 2)])
      : 0;
    return { total, done, inProgress, overdue, avg, median };
  }, [filteredTasks]);

  const chartData = useMemo(() => {
    const statusDistribution = [
      { name: 'Bekliyor', value: filteredTasks.filter((task) => task.status === 'bekliyor').length },
      {
        name: 'Devam Ediyor',
        value: filteredTasks.filter((task) => task.status === 'devam_ediyor').length
      },
      {
        name: 'Duraklatıldı',
        value: filteredTasks.filter((task) => task.status === 'duraklatildi').length
      },
      {
        name: 'Tamamlandı',
        value: filteredTasks.filter((task) => task.status === 'tamamlandi').length
      }
    ];

    const [start, end] = dateRange;
    const days = [];
    if (start && end) {
      let cursor = start.startOf('day');
      const last = end.startOf('day');
      while (cursor.isBefore(last) || cursor.isSame(last)) {
        const label = cursor.format('DD.MM.YYYY');
        const count = filteredTasks.filter(
          (task) =>
            task.status === 'tamamlandi' &&
            task.completedAt &&
            dayjs(task.completedAt).format('DD.MM.YYYY') === label
        ).length;
        days.push({ date: label, count });
        cursor = cursor.add(1, 'day');
      }
    }

    const platforms = ['Instagram', 'TikTok', 'YouTube', 'X'];
    const platformWorkload = platforms.map((platformName) => ({
      platform: platformName,
      count: filteredTasks.filter((task) => (task.platforms || []).includes(platformName)).length
    }));

    const influencerWorkload = influencers
      .map((inf) => ({
        influencer: inf.fullName,
        count: filteredTasks.filter((task) => task.influencerName === inf.fullName).length
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    return { statusDistribution, days, platformWorkload, influencerWorkload };
  }, [filteredTasks, dateRange, influencers]);

  const rows = useMemo(
    () =>
      searchedTasks.map((task) => ({
        id: task.id,
        startAt: formatDate(task.createdAt),
        title: task.title,
        influencer: task.influencerName,
        platform: (task.platforms || []).join(', ') || '-',
        status: task.status
      })),
    [searchedTasks]
  );

  const exportCsv = () => {
    if (!rows.length) return;
    const header = ['Tarih', 'Başlık', 'Influencer', 'Platform', 'Durum'];
    const csv = [header.join(';')]
      .concat(
        rows.map((row) =>
          [row.startAt, row.title, row.influencer, row.platform, row.status]
            .map((value) => `"${String(value).replace(/"/g, '""')}"`)
            .join(';')
        )
      )
      .join('\n');

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'performans-raporu.csv';
    link.click();
    URL.revokeObjectURL(link.href);
  };

  const handleDateChange = (index) => (newValue) => {
    setDateRange((prev) => {
      const next = [...prev];
      next[index] = newValue;
      return next;
    });
  };

  dayjs.locale('tr');
  const datePickerSlots = { openPickerIcon: CalendarTodayIcon };
  const datePickerSlotProps = {
    textField: {
      size: 'small',
      fullWidth: true,
      sx: {
        '& .MuiInputBase-root': {
          height: 40,
          borderRadius: 8,
          fontSize: 14
        },
        '& .MuiInputBase-input': {
          padding: '8.5px 12px'
        },
        '& .MuiIconButton-root': {
          backgroundColor: '#fff !important',
          color: '#000',
          opacity: 1,
          boxShadow: 'none',
          '&:hover': {
            backgroundColor: '#fff !important',
            opacity: 1,
            boxShadow: 'none'
          },
          '&:active': {
            backgroundColor: '#fff !important',
            opacity: 1,
            boxShadow: 'none'
          },
          '&.Mui-focusVisible, &:focus': {
            backgroundColor: '#fff !important',
            opacity: 1,
            outline: 'none',
            boxShadow: 'none'
          },
          '& .MuiTouchRipple-root': {
            display: 'none'
          }
        }
      }
    },
    openPickerButton: {
      size: 'small',
      disableRipple: true,
      disableFocusRipple: true,
      sx: {
        color: '#000',
        opacity: 1,
        backgroundColor: '#fff !important',
        boxShadow: 'none',
        '&:hover': {
          backgroundColor: '#fff !important',
          opacity: 1,
          boxShadow: 'none'
        },
        '&:active': {
          backgroundColor: '#fff !important',
          opacity: 1,
          boxShadow: 'none'
        },
        '&.Mui-focusVisible, &:focus': {
          outline: 'none',
          boxShadow: 'none',
          backgroundColor: '#fff !important',
          opacity: 1
        },
        '& .MuiTouchRipple-root': {
          display: 'none'
        }
      }
    },
    openPickerIcon: { fontSize: 'small', sx: { color: '#000' } }
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale="tr">
      <Box display="flex" flexDirection="column" gap={3}>
        <Card>
          <CardContent>
            <Box display="flex" justifyContent="space-between" alignItems="center" flexWrap="wrap" gap={2}>
              <Box>
                <Typography variant="h5" fontWeight={600}>
                  Analiz / Rapor
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Detaylı performans analizi ve filtrelenebilir raporlar.
                </Typography>
              </Box>
            </Box>
            <Divider sx={{ my: 2 }} />
            <Grid container spacing={2}>
              <Grid item xs={12} md={5}>
                <Stack direction="row" spacing={2}>
                  <DatePicker
                    label="Başlangıç"
                    value={dateRange[0]}
                    onChange={handleDateChange(0)}
                    format="DD/MM/YYYY"
                    slots={datePickerSlots}
                    slotProps={datePickerSlotProps}
                  />
                  <DatePicker
                    label="Bitiş"
                    value={dateRange[1]}
                    onChange={handleDateChange(1)}
                    format="DD/MM/YYYY"
                    slots={datePickerSlots}
                    slotProps={datePickerSlotProps}
                  />
                </Stack>
              </Grid>
              <Grid item xs={12} md={2}>
                <FormControl fullWidth size="small">
                  <InputLabel>Platform</InputLabel>
                  <Select value={platform} label="Platform" onChange={(e) => setPlatform(e.target.value)}>
                    <MenuItem value="all">Tümü</MenuItem>
                    <MenuItem value="Instagram">Instagram</MenuItem>
                    <MenuItem value="TikTok">TikTok</MenuItem>
                    <MenuItem value="YouTube">YouTube</MenuItem>
                    <MenuItem value="X">X</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} md={2}>
                <FormControl fullWidth size="small">
                  <InputLabel>Durum</InputLabel>
                  <Select value={status} label="Durum" onChange={(e) => setStatus(e.target.value)}>
                    {STATUS_OPTIONS.map((option) => (
                      <MenuItem key={option.value} value={option.value}>
                        {option.label}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} md={3}>
                <FormControl fullWidth size="small">
                  <InputLabel>Influencer</InputLabel>
                  <Select value={influencer} label="Influencer" onChange={(e) => setInfluencer(e.target.value)}>
                    <MenuItem value="all">Tümü</MenuItem>
                    {influencers.map((item) => (
                      <MenuItem key={item._id} value={item.fullName}>
                        {item.fullName}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} md={12}>
                <Stack direction="row" spacing={1.5} justifyContent="flex-end">
                  <Button
                    variant="contained"
                    size="small"
                    onClick={clearFilters}
                    sx={{
                      borderRadius: 2,
                      px: 2.5,
                      height: 36,
                      textTransform: 'none'
                    }}
                  >
                    Temizle
                  </Button>
                  <Button
                    variant="contained"
                    size="small"
                    onClick={() => setPreset(preset)}
                    sx={{
                      borderRadius: 2,
                      px: 2.5,
                      height: 36,
                      textTransform: 'none'
                    }}
                  >
                    Uygula
                  </Button>
                </Stack>
              </Grid>
            </Grid>
          </CardContent>
        </Card>

        <Grid container spacing={2}>
          <Grid item xs={12} md={2}>
            <Card>
              <CardContent>
                <Typography variant="body2">Toplam İş</Typography>
                <Typography variant="h5">{kpi.total}</Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={2}>
            <Card>
              <CardContent>
                <Typography variant="body2">Tamamlanan</Typography>
                <Typography variant="h5">{kpi.done}</Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={2}>
            <Card>
              <CardContent>
                <Typography variant="body2">Devam Eden</Typography>
                <Typography variant="h5">{kpi.inProgress}</Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={2}>
            <Card>
              <CardContent>
                <Typography variant="body2">Geciken</Typography>
                <Typography variant="h5">{kpi.overdue}</Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={2}>
            <Card>
              <CardContent>
                <Typography variant="body2">Ort. Tamamlanma (gün)</Typography>
                <Typography variant="h5">{kpi.avg}</Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={2}>
            <Card>
              <CardContent>
                <Typography variant="body2">Medyan Tamamlanma</Typography>
                <Typography variant="h5">{kpi.median}</Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        <Grid container spacing={2}>
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="subtitle1" fontWeight={600} gutterBottom>
                  Durum Dağılımı
                </Typography>
                {hasValue(chartData.statusDistribution) ? (
                  <Box height={260}>
                    <ResponsiveContainer>
                      <PieChart>
                        <Pie data={chartData.statusDistribution} dataKey="value" nameKey="name" outerRadius={90}>
                          {chartData.statusDistribution.map((entry, index) => (
                            <Cell
                              key={entry.name}
                              fill={['#f59e0b', '#3b82f6', '#ef4444', '#22c55e'][index % 4]}
                            />
                          ))}
                        </Pie>
                        <Tooltip />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  </Box>
                ) : (
                  <ChartEmpty />
                )}
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="subtitle1" fontWeight={600} gutterBottom>
                  Günlük Tamamlanan
                </Typography>
                {hasValue(chartData.days, 'count') ? (
                  <Box height={260}>
                    <ResponsiveContainer>
                      <LineChart data={chartData.days}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="date" />
                        <YAxis />
                        <Tooltip />
                        <Line type="monotone" dataKey="count" stroke="#2563eb" />
                      </LineChart>
                    </ResponsiveContainer>
                  </Box>
                ) : (
                  <ChartEmpty />
                )}
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        <Grid container spacing={2}>
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="subtitle1" fontWeight={600} gutterBottom>
                  Platform Bazlı İş Yükü
                </Typography>
                {hasValue(chartData.platformWorkload, 'count') ? (
                  <Box height={260}>
                    <ResponsiveContainer>
                      <BarChart data={chartData.platformWorkload}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="platform" />
                        <YAxis />
                        <Tooltip />
                        <Bar dataKey="count" fill="#22c55e" />
                      </BarChart>
                    </ResponsiveContainer>
                  </Box>
                ) : (
                  <ChartEmpty />
                )}
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Box display="flex" justifyContent="space-between" alignItems="center" gap={1}>
                  <Typography variant="subtitle1" fontWeight={600}>
                    Influencer Bazlı İş Yükü (Top 10)
                  </Typography>
                </Box>
                {hasValue(chartData.influencerWorkload, 'count') ? (
                  <Box height={260}>
                    <ResponsiveContainer>
                      <BarChart data={chartData.influencerWorkload}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="influencer" />
                        <YAxis />
                        <Tooltip />
                        <Bar dataKey="count" fill="#f59e0b" />
                      </BarChart>
                    </ResponsiveContainer>
                  </Box>
                ) : (
                  <ChartEmpty />
                )}
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        <Card>
          <CardContent>
            <Box display="flex" justifyContent="space-between" alignItems="center" flexWrap="wrap" gap={2}>
              <Typography variant="h6">İş Detayları</Typography>
            </Box>
            <Box mt={2} mb={2} display="flex" alignItems="center" gap={2}>
              <TextField
                label="Tabloda Ara"
                size="small"
                fullWidth
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                sx={{ flex: 1 }}
              />
              <Button
                variant="contained"
                size="small"
                onClick={exportCsv}
                sx={{ borderRadius: 2, px: 2.5, height: 36 }}
              >
                CSV İndir
              </Button>
            </Box>
            <Box height={520}>
              <DataGrid
                rows={rows}
                columns={[
                  { field: 'startAt', headerName: 'Tarih', width: 120 },
                  { field: 'title', headerName: 'Başlık', width: 280 },
                  { field: 'influencer', headerName: 'Influencer', width: 180 },
                  { field: 'platform', headerName: 'Platform', width: 160 },
                  { field: 'status', headerName: 'Durum', width: 140 }
                ]}
                pageSizeOptions={[10, 25, 50]}
                initialState={{
                  pagination: { paginationModel: { pageSize: 10, page: 0 } }
                }}
                onRowClick={(params) => setDrawerTask(params.row)}
                disableRowSelectionOnClick
                columnHeaderHeight={48}
                rowHeight={52}
                slots={{
                  columnMenuIcon: MoreVertIcon
                }}
                sx={{
                  '& .MuiDataGrid-virtualScrollerContent': {
                    maxWidth: '100%'
                  },
                  '& .MuiDataGrid-columnHeaders': {
                    borderBottom: '1px solid',
                    borderColor: 'divider'
                  },
                  '& .MuiDataGrid-columnHeaderTitleContainer': {
                    overflow: 'hidden',
                    justifyContent: 'space-between',
                    gap: 1
                  },
                  '& .MuiDataGrid-columnHeaderTitle': {
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap'
                  },
                  '& .MuiDataGrid-cell': {
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap'
                  },
                  '& .MuiDataGrid-columnHeader': {
                    backgroundColor: 'transparent'
                  },
                  '& .MuiDataGrid-iconButtonContainer': {
                    visibility: 'visible !important',
                    width: 'auto !important',
                    opacity: 1,
                    display: 'inline-flex'
                  },
                  '& .MuiDataGrid-menuIcon': {
                    visibility: 'visible !important',
                    width: 'auto !important',
                    opacity: 1
                  },
                  '& .MuiDataGrid-iconButtonContainer .MuiTouchRipple-root': {
                    display: 'none'
                  },
                  '& .MuiDataGrid-columnHeader .MuiIconButton-root': {
                    padding: '4px',
                    borderRadius: '8px',
                    color: 'text.secondary',
                    backgroundColor: 'transparent',
                    opacity: 1,
                    visibility: 'visible',
                    display: 'inline-flex',
                    '&:hover': {
                      backgroundColor: 'rgba(0,0,0,0.04)'
                    },
                    '&.Mui-focusVisible': {
                      outline: 'none'
                    }
                  },
                  '& .MuiDataGrid-menuIconButton': {
                    color: 'text.secondary',
                    backgroundColor: 'transparent',
                    opacity: 1,
                    visibility: 'visible',
                    display: 'inline-flex'
                  },
                  '& .MuiDataGrid-sortIcon': {
                    fontSize: 18,
                    opacity: '1 !important',
                    visibility: 'visible !important'
                  },
                  '& .MuiDataGrid-iconButtonContainer .MuiDataGrid-sortIcon': {
                    opacity: '1 !important',
                    visibility: 'visible !important'
                  },
                  '& .MuiDataGrid-columnHeader:hover .MuiDataGrid-sortIcon': {
                    opacity: '1 !important',
                    visibility: 'visible !important'
                  },
                  '& .MuiDataGrid-columnHeader--sorted .MuiDataGrid-sortIcon': {
                    color: 'primary.main'
                  },
                  '& .MuiDataGrid-columnHeader--sorted .MuiDataGrid-columnHeaderTitle': {
                    color: 'text.primary'
                  }
                }}
              />
            </Box>
          </CardContent>
        </Card>

        <Drawer anchor="right" open={Boolean(drawerTask)} onClose={() => setDrawerTask(null)}>
          {drawerTask ? (
            <Box width={320} p={3}>
              <Typography variant="h6" gutterBottom>
                {drawerTask.title}
              </Typography>
              <Chip label={drawerTask.status} color="primary" size="small" />
              <Typography variant="body2" mt={2}>
                Influencer: {drawerTask.influencer}
              </Typography>
              <Typography variant="body2" mt={1}>
                Platform: {drawerTask.platform}
              </Typography>
              <Typography variant="body2" mt={1}>
                Başlangıç: {drawerTask.startAt}
              </Typography>
              <Typography variant="body2" mt={1}>
                Bitiş: {drawerTask.dueDate}
              </Typography>
            </Box>
          ) : null}
        </Drawer>
      </Box>
    </LocalizationProvider>
  );
};

export default PerformancePage;






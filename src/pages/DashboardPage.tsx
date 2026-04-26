import {
  Autocomplete,
  Box,
  Button,
  Paper,
  Typography,
  Grid,
  TextField,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  CircularProgress,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  IconButton,
  TableSortLabel,
} from '@mui/material';
import { Search, Clear, TrendingUp, Assignment, Warning, PauseCircle, Close } from '@mui/icons-material';
import { useState, useEffect, useMemo, useRef } from 'react';
import { Navigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { appRepository } from '@/repositories/AppRepository';
import { PercentBadge } from '@/components/PercentBadge';
import { ListPagination } from '@/components/ListPagination';
import { ModuleType } from '@/domain/enums';
import { ModuleSelect } from '@/components/ModuleSelect';
import { useAuthStore } from '@/stores/authStore';
import { Contract, Team, UserRole } from '@/domain';
import { KpiCard, PageHeader, SectionTable } from '@/components/ui';

type TeamRankingItem = {
  teamId: string;
  teamName: string;
  averagePercent: number;
  inspectionsCount: number;
  pendingCount: number;
  paralyzedCount: number;
  paralysisRatePercent: number;
};

type NonConformityQuestionItem = {
  checklistItemId: string;
  checklistItemTitle: string;
  nonConformitiesCount: number;
  answersCount: number;
  nonConformityRatePercent: number;
};

type NonConformityChecklist = {
  checklistId: string;
  checklistName: string;
  totalNonConformities: number;
  questions: NonConformityQuestionItem[];
};

type SortKey = 'averagePercent' | 'pendingCount' | 'paralysisRatePercent' | null;
const MIN_TEAM_SEARCH_LENGTH = 4;
const NON_CONFORMITIES_LIMIT_PER_CHECKLIST = 3;

function getDefaultDateRange(): { from: string; to: string } {
  const to = new Date();
  const from = new Date(to);
  from.setDate(from.getDate() - 30);
  return {
    from: from.toISOString().slice(0, 10),
    to: to.toISOString().slice(0, 10),
  };
}

export const DashboardPage = (): JSX.Element => {
  const { hasAnyRole, user } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const isAdmin = user?.role === UserRole.ADMIN;
  const availableContracts = user?.contracts ?? [];
  const [adminContracts, setAdminContracts] = useState<Array<Pick<Contract, 'id' | 'name'>>>([]);
  const contractsForFilters = isAdmin ? adminContracts : availableContracts;
  const [filters, setFilters] = useState<{
    from?: string;
    to?: string;
    module?: ModuleType;
    teamId?: string;
    contractId?: string;
  }>(() => ({
    ...getDefaultDateRange(),
    module: undefined,
    teamId: undefined,
    contractId: undefined,
  }));
  const [summary, setSummary] = useState({ averagePercent: 0, inspectionsCount: 0, pendingCount: 0 });
  const [teamRanking, setTeamRanking] = useState<TeamRankingItem[]>([]);
  const [nonConformitiesByChecklist, setNonConformitiesByChecklist] = useState<NonConformityChecklist[]>([]);
  const [selectedTeamId, setSelectedTeamId] = useState<string | null>(null);
  const [teamDetail, setTeamDetail] = useState<TeamRankingItem | null>(null);
  const [teamDetailLoading, setTeamDetailLoading] = useState(false);
  const [teamDetailError, setTeamDetailError] = useState<string | null>(null);
  const [orderBy, setOrderBy] = useState<SortKey>(null);
  const [order, setOrder] = useState<'asc' | 'desc'>('asc');
  const [rankingPage, setRankingPage] = useState(1);
  const [rankingLimit, setRankingLimit] = useState(10);
  const [teamFilterSearchInput, setTeamFilterSearchInput] = useState('');
  const [selectedSummaryTeam, setSelectedSummaryTeam] = useState<Team | null>(null);
  const [teamFilterOptions, setTeamFilterOptions] = useState<Team[]>([]);
  const [teamFilterLoading, setTeamFilterLoading] = useState(false);
  const teamFilterDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const teamFilterRequestRef = useRef(0);

  const canAccessDashboard = hasAnyRole([UserRole.GESTOR, UserRole.ADMIN]);

  useEffect(() => {
    if (!isAdmin) {
      setAdminContracts([]);
      return;
    }
    let cancelled = false;
    const loadContracts = async () => {
      try {
        const result = await appRepository.getContracts({ page: 1, limit: 100 });
        if (!cancelled) setAdminContracts(result.data);
      } catch {
        if (!cancelled) setAdminContracts([]);
      }
    };
    void loadContracts();
    return () => {
      cancelled = true;
    };
  }, [isAdmin]);

  useEffect(() => {
    if (contractsForFilters.length === 1) {
      const singleContractId = contractsForFilters[0].id;
      setFilters((prev) => ({
        ...prev,
        contractId: prev.contractId || singleContractId,
      }));
      return;
    }
    if (
      filters.contractId &&
      !contractsForFilters.some((contract) => contract.id === filters.contractId)
    ) {
      setFilters((prev) => ({ ...prev, contractId: undefined, teamId: undefined }));
      setSelectedSummaryTeam(null);
      setTeamFilterSearchInput('');
      setTeamFilterOptions([]);
    }
  }, [contractsForFilters, filters.contractId]);

  useEffect(() => {
    if (canAccessDashboard) {
      loadDashboardData();
    }
  }, []);

  useEffect(() => {
    const trimmed = teamFilterSearchInput.trim();
    if (trimmed.length < MIN_TEAM_SEARCH_LENGTH) {
      if (teamFilterDebounceRef.current) {
        clearTimeout(teamFilterDebounceRef.current);
        teamFilterDebounceRef.current = null;
      }
      setTeamFilterLoading(false);
      setTeamFilterOptions(selectedSummaryTeam ? [selectedSummaryTeam] : []);
      return;
    }

    if (teamFilterDebounceRef.current) clearTimeout(teamFilterDebounceRef.current);
    teamFilterDebounceRef.current = setTimeout(async () => {
      const requestId = ++teamFilterRequestRef.current;
      setTeamFilterLoading(true);
      try {
        const result = await appRepository.getTeams({
          page: 1,
          limit: 20,
          name: trimmed,
          contractId: filters.contractId,
        });
        if (requestId !== teamFilterRequestRef.current) return;
        const selectedOptions = selectedSummaryTeam ? [selectedSummaryTeam] : [];
        setTeamFilterOptions(
          [...selectedOptions, ...result.data].filter(
            (team, index, all) => all.findIndex((existing) => existing.id === team.id) === index
          )
        );
      } catch {
        if (requestId !== teamFilterRequestRef.current) return;
        setTeamFilterOptions(selectedSummaryTeam ? [selectedSummaryTeam] : []);
      } finally {
        if (requestId === teamFilterRequestRef.current) {
          setTeamFilterLoading(false);
        }
      }
      teamFilterDebounceRef.current = null;
    }, 400);

    return () => {
      if (teamFilterDebounceRef.current) clearTimeout(teamFilterDebounceRef.current);
    };
  }, [teamFilterSearchInput, selectedSummaryTeam, filters.contractId]);

  const loadDashboardData = async (overrideFilters?: typeof filters) => {
    const effectiveFilters = overrideFilters ?? filters;
    if (!effectiveFilters.from || !effectiveFilters.to) {
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const [summaryData, rankingData, nonConformitiesData] = await Promise.all([
        appRepository.getDashboardSummary(effectiveFilters),
        appRepository.getDashboardTeamRanking({
          from: effectiveFilters.from,
          to: effectiveFilters.to,
          module: effectiveFilters.module,
          contractId: effectiveFilters.contractId,
        }),
        appRepository.getDashboardNonConformitiesByChecklist({
          from: effectiveFilters.from,
          to: effectiveFilters.to,
          module: effectiveFilters.module,
          teamId: effectiveFilters.teamId,
          contractId: effectiveFilters.contractId,
          limitPerChecklist: NON_CONFORMITIES_LIMIT_PER_CHECKLIST,
        }),
      ]);
      setSummary(summaryData);
      setTeamRanking(rankingData);
      setNonConformitiesByChecklist(nonConformitiesData.checklists);
      setRankingPage(1);
    } catch (err) {
      const message =
        (err as { response?: { status?: number } })?.response?.status === 403
          ? 'Você não tem permissão para acessar o dashboard.'
          : 'Falha ao carregar o dashboard. Tente novamente.';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const handleClearFilters = () => {
    const defaultRange = {
      ...getDefaultDateRange(),
      module: undefined as ModuleType | undefined,
      teamId: undefined,
      contractId: undefined,
    };
    setFilters(defaultRange);
    setSelectedSummaryTeam(null);
    setTeamFilterSearchInput('');
    setTeamFilterOptions([]);
    loadDashboardData(defaultRange);
  };

  const handleOpenTeamDetail = (teamId: string) => {
    setSelectedTeamId(teamId);
    setTeamDetail(null);
    setTeamDetailError(null);
    setTeamDetailLoading(true);
    const query = {
      from: filters.from,
      to: filters.to,
      module: filters.module,
      contractId: filters.contractId,
    };
    appRepository
      .getDashboardTeam(teamId, query)
      .then((data) => {
        setTeamDetail(data);
      })
      .catch((err: unknown) => {
        const status = (err as { response?: { status?: number } })?.response?.status;
        if (status === 404) {
          setTeamDetailError('Equipe não encontrada.');
          toast.error('Equipe não encontrada.');
        }
      })
      .finally(() => {
        setTeamDetailLoading(false);
      });
  };

  const handleCloseTeamDetail = () => {
    setSelectedTeamId(null);
    setTeamDetail(null);
    setTeamDetailError(null);
  };

  const handleSort = (key: SortKey) => {
    if (orderBy === key) {
      setOrder(order === 'asc' ? 'desc' : 'asc');
    } else {
      setOrderBy(key);
      setOrder(key === 'averagePercent' ? 'desc' : 'asc');
    }
  };

  const sortedRanking = useMemo(() => {
    if (!orderBy) return teamRanking;
    return [...teamRanking].sort((a, b) => {
      const aVal = a[orderBy];
      const bVal = b[orderBy];
      const cmp = typeof aVal === 'number' && typeof bVal === 'number' ? aVal - bVal : 0;
      return order === 'asc' ? cmp : -cmp;
    });
  }, [teamRanking, orderBy, order]);

  const rankingMeta = useMemo(() => {
    const total = sortedRanking.length;
    const totalPages = Math.max(1, Math.ceil(total / rankingLimit));
    return {
      page: rankingPage,
      limit: rankingLimit,
      total,
      totalPages,
      hasNext: rankingPage < totalPages,
      hasPrev: rankingPage > 1,
    };
  }, [sortedRanking.length, rankingPage, rankingLimit]);

  const pagedRanking = useMemo(
    () =>
      sortedRanking.slice(
        (rankingPage - 1) * rankingLimit,
        rankingPage * rankingLimit
      ),
    [sortedRanking, rankingPage, rankingLimit]
  );

  if (!canAccessDashboard) {
    return <Navigate to="/inspections/mine" replace />;
  }

  return (
    <Box position="relative">
      {loading && (
        <Box
          position="absolute"
          top={0}
          left={0}
          right={0}
          bottom={0}
          display="flex"
          alignItems="center"
          justifyContent="center"
          sx={{
            bgcolor: 'rgba(255, 255, 255, 0.7)',
            zIndex: 10,
          }}
        >
          <CircularProgress />
        </Box>
      )}
      <PageHeader
        eyebrow="Gestão de performance"
        title="Dashboard Operacional"
        subtitle="Acompanhe indicadores, desempenho de equipes e pendências em um painel centralizado."
      />

      <Paper sx={{ p: 2, mb: 3 }}>
        <Grid container spacing={2} sx={{ mb: 2 }}>
          <Grid item xs={12} sm={6} md={3}>
            <TextField
              fullWidth
              required
              type="date"
              label="Data inicial"
              value={filters.from || ''}
              InputLabelProps={{ shrink: true }}
              inputProps={{ max: filters.to || undefined }}
              onChange={(e) => {
                const from = e.target.value || undefined;
                setFilters((prev) => {
                  const next = { ...prev, from };
                  if (from && prev.to && from > prev.to) next.to = from;
                  return next;
                });
              }}
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <TextField
              fullWidth
              required
              type="date"
              label="Data final"
              value={filters.to || ''}
              InputLabelProps={{ shrink: true }}
              inputProps={{ min: filters.from || undefined }}
              onChange={(e) => {
                const to = e.target.value || undefined;
                setFilters((prev) => {
                  const next = { ...prev, to };
                  if (to && prev.from && to < prev.from) next.from = to;
                  return next;
                });
              }}
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <ModuleSelect
              value={filters.module || ''}
              onChange={(value) => setFilters((prev) => ({ ...prev, module: value }))}
              label="Módulo"
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <FormControl fullWidth>
              <InputLabel>Contrato</InputLabel>
              <Select
                value={filters.contractId || ''}
                label="Contrato"
                onChange={(e) => {
                  const nextContractId = e.target.value || undefined;
                  setSelectedSummaryTeam(null);
                  setTeamFilterSearchInput('');
                  setTeamFilterOptions([]);
                  setFilters((prev) => ({ ...prev, contractId: nextContractId, teamId: undefined }));
                }}
              >
                <MenuItem value="">
                  <em>Todos os contratos</em>
                </MenuItem>
                {contractsForFilters.map((contract) => (
                  <MenuItem key={contract.id} value={contract.id}>
                    {contract.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Autocomplete
              options={teamFilterOptions}
              value={selectedSummaryTeam}
              inputValue={teamFilterSearchInput}
              onChange={(_, value) => {
                setSelectedSummaryTeam(value);
                setFilters((prev) => ({ ...prev, teamId: value?.id || undefined }));
                if (value) {
                  setTeamFilterSearchInput(value.name);
                }
              }}
              onInputChange={(_, value, reason) => {
                setTeamFilterSearchInput(value);
                if (reason === 'clear') {
                  setSelectedSummaryTeam(null);
                  setTeamFilterOptions([]);
                  setFilters((prev) => ({ ...prev, teamId: undefined }));
                  return;
                }

                if (reason === 'input' && selectedSummaryTeam && value !== selectedSummaryTeam.name) {
                  setSelectedSummaryTeam(null);
                  setFilters((prev) => ({ ...prev, teamId: undefined }));
                }
              }}
              loading={teamFilterLoading}
              filterOptions={(options) => options}
              getOptionLabel={(option) => option.name}
              isOptionEqualToValue={(option, value) => option.id === value.id}
              noOptionsText={
                teamFilterSearchInput.trim().length < MIN_TEAM_SEARCH_LENGTH
                  ? `Digite pelo menos ${MIN_TEAM_SEARCH_LENGTH} caracteres`
                  : 'Nenhuma equipe encontrada'
              }
              renderInput={(params) => (
                <TextField
                  {...params}
                  fullWidth
                  label="Equipe (resumo)"
                  placeholder="Digite o nome da equipe"
                  helperText="Busque equipes pelo nome"
                  InputProps={{
                    ...params.InputProps,
                    endAdornment: (
                      <>
                        {teamFilterLoading ? <CircularProgress color="inherit" size={18} /> : null}
                        {params.InputProps.endAdornment}
                      </>
                    ),
                  }}
                />
              )}
            />
          </Grid>
        </Grid>
        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
          <Button
            variant="contained"
            startIcon={<Search />}
            onClick={() => loadDashboardData()}
            disabled={!filters.from || !filters.to}
          >
            Buscar
          </Button>
          <Button variant="outlined" startIcon={<Clear />} onClick={handleClearFilters}>
            Limpar filtros
          </Button>
        </Box>
      </Paper>

      {error && (
        <Paper sx={{ p: 2, mb: 3, bgcolor: 'error.light' }}>
          <Typography color="error.contrastText" gutterBottom>
            {error}
          </Typography>
          <Button variant="contained" color="inherit" size="small" onClick={() => loadDashboardData()}>
            Tentar novamente
          </Button>
        </Paper>
      )}

      {!error && summary && (
        <>
          <Grid container spacing={3} sx={{ mb: 3 }}>
            <Grid item xs={12} md={4}>
              <KpiCard
                icon={<TrendingUp color="primary" />}
                label="Média Geral"
                value={<PercentBadge percent={summary.averagePercent} size="large" />}
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <KpiCard
                icon={<Assignment color="primary" />}
                label="Serviços Avaliados"
                value={<Typography variant="h3" sx={{ color: 'primary.dark' }}>{summary.inspectionsCount}</Typography>}
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <KpiCard
                icon={<Warning color="warning" />}
                label="Pendentes de Ajuste"
                tone="warning"
                value={<Typography variant="h3" color="warning.main">{summary.pendingCount}</Typography>}
              />
            </Grid>
          </Grid>

          <SectionTable title="Ranking por Equipes">
            {teamRanking.length === 0 ? (
              <Box sx={{ p: 4, textAlign: 'center' }}>
                <Typography color="text.secondary">
                  Nenhum dado no período ou módulo selecionado. Ajuste os filtros e busque novamente.
                </Typography>
              </Box>
            ) : (
              <>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Equipe</TableCell>
                      <TableCell align="center">
                        <TableSortLabel
                          active={orderBy === 'averagePercent'}
                          direction={orderBy === 'averagePercent' ? order : 'asc'}
                          onClick={() => handleSort('averagePercent')}
                        >
                          Média
                        </TableSortLabel>
                      </TableCell>
                      <TableCell align="center">Qtd Vistorias</TableCell>
                      <TableCell align="center">
                        <TableSortLabel
                          active={orderBy === 'pendingCount'}
                          direction={orderBy === 'pendingCount' ? order : 'asc'}
                          onClick={() => handleSort('pendingCount')}
                        >
                          Pendentes
                        </TableSortLabel>
                      </TableCell>
                      <TableCell align="center">Paralisadas</TableCell>
                      <TableCell align="center">
                        <TableSortLabel
                          active={orderBy === 'paralysisRatePercent'}
                          direction={orderBy === 'paralysisRatePercent' ? order : 'asc'}
                          onClick={() => handleSort('paralysisRatePercent')}
                        >
                          Taxa paralisação
                        </TableSortLabel>
                      </TableCell>
                      <TableCell align="center" padding="none">
                        Detalhe
                      </TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {pagedRanking.map((team) => {
                      return (
                        <TableRow key={team.teamId} hover>
                          <TableCell>{team.teamName}</TableCell>
                          <TableCell align="center">
                            <PercentBadge percent={team.averagePercent} size="small" />
                          </TableCell>
                          <TableCell align="center">{team.inspectionsCount}</TableCell>
                          <TableCell align="center">
                            <Chip
                              label={team.pendingCount}
                              color={team.pendingCount > 0 ? 'warning' : 'default'}
                              size="small"
                              icon={team.pendingCount > 0 ? <Warning fontSize="small" /> : undefined}
                            />
                          </TableCell>
                          <TableCell align="center">
                            <Chip
                              label={team.paralyzedCount}
                              color={team.paralyzedCount > 0 ? 'error' : 'default'}
                              size="small"
                              icon={team.paralyzedCount > 0 ? <PauseCircle fontSize="small" /> : undefined}
                            />
                          </TableCell>
                          <TableCell align="center">
                            <Typography
                              variant="body2"
                              color={team.paralysisRatePercent > 0 ? 'error.main' : 'text.secondary'}
                            >
                              {team.paralysisRatePercent}%
                            </Typography>
                          </TableCell>
                          <TableCell align="center" padding="none">
                            <Button
                              size="small"
                              variant="text"
                              onClick={() => handleOpenTeamDetail(team.teamId)}
                            >
                              Ver detalhe
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
                {rankingMeta.total > 0 && (
                  <ListPagination
                    meta={rankingMeta}
                    onPageChange={setRankingPage}
                    onRowsPerPageChange={(newLimit) => {
                      setRankingLimit(newLimit);
                      setRankingPage(1);
                    }}
                    rowsPerPageOptions={[5, 10, 25, 50]}
                    disabled={loading}
                  />
                )}
              </>
            )}
          </SectionTable>

          <SectionTable
            title={`Perguntas com mais NÃO CONFORMIDADES por checklist (TOP ${NON_CONFORMITIES_LIMIT_PER_CHECKLIST})`}
          >
            {nonConformitiesByChecklist.length === 0 ? (
              <Box sx={{ p: 4, textAlign: 'center' }}>
                <Typography color="text.secondary">
                  Nenhuma não conformidade encontrada para os filtros selecionados.
                </Typography>
              </Box>
            ) : (
              <Grid container spacing={2}>
                {nonConformitiesByChecklist.map((checklist) => {
                  const maxCount = Math.max(...checklist.questions.map((question) => question.nonConformitiesCount), 1);
                  return (
                    <Grid item xs={12} lg={6} key={checklist.checklistId}>
                      <Paper variant="outlined" sx={{ p: 2, height: '100%' }}>
                        <Box sx={{ mb: 2 }}>
                          <Typography variant="subtitle1" fontWeight={700}>
                            {checklist.checklistName}
                          </Typography>
                        </Box>

                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.75 }}>
                          {checklist.questions.map((question) => {
                            const widthPercent = Math.max((question.nonConformitiesCount / maxCount) * 100, 4);
                            return (
                              <Box key={question.checklistItemId}>
                                <Box
                                  sx={{
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'baseline',
                                    gap: 1,
                                  }}
                                >
                                  <Typography
                                    variant="body2"
                                    title={question.checklistItemTitle}
                                    sx={{
                                      fontWeight: 500,
                                      overflow: 'hidden',
                                      textOverflow: 'ellipsis',
                                      whiteSpace: 'nowrap',
                                    }}
                                  >
                                    {question.checklistItemTitle}
                                  </Typography>
                                  <Typography variant="caption" color="text.secondary" sx={{ whiteSpace: 'nowrap' }}>
                                    {question.nonConformitiesCount} Não conformes ({question.nonConformityRatePercent}%)
                                  </Typography>
                                </Box>
                                <Box
                                  sx={{
                                    mt: 0.6,
                                    height: 8,
                                    borderRadius: 99,
                                    bgcolor: 'grey.200',
                                    overflow: 'hidden',
                                  }}
                                >
                                  <Box
                                    sx={{
                                      width: `${widthPercent}%`,
                                      height: '100%',
                                      bgcolor: 'error.main',
                                      borderRadius: 99,
                                    }}
                                  />
                                </Box>
                                <Typography variant="caption" color="text.secondary">
                                  {question.answersCount} respostas no período
                                </Typography>
                              </Box>
                            );
                          })}
                        </Box>
                      </Paper>
                    </Grid>
                  );
                })}
              </Grid>
            )}
          </SectionTable>
        </>
      )}

      <Dialog open={!!selectedTeamId} onClose={handleCloseTeamDetail} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          Desempenho da equipe
          <IconButton onClick={handleCloseTeamDetail} size="small" aria-label="Fechar">
            <Close />
          </IconButton>
        </DialogTitle>
        <DialogContent>
          {teamDetailLoading && (
            <Box display="flex" justifyContent="center" p={4}>
              <CircularProgress />
            </Box>
          )}
          {teamDetailError && !teamDetailLoading && (
            <Typography color="text.secondary" sx={{ py: 2 }}>
              {teamDetailError}
            </Typography>
          )}
          {teamDetail && !teamDetailLoading && (
            <Grid container spacing={2} sx={{ pt: 1 }}>
              <Grid item xs={12}>
                <Typography variant="subtitle1" fontWeight="bold">
                  {teamDetail.teamName}
                </Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="body2" color="text.secondary">
                  Média
                </Typography>
                <PercentBadge percent={teamDetail.averagePercent} size="small" />
              </Grid>
              <Grid item xs={6}>
                <Typography variant="body2" color="text.secondary">
                  Vistorias
                </Typography>
                <Typography variant="body1">{teamDetail.inspectionsCount}</Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="body2" color="text.secondary">
                  Pendentes
                </Typography>
                <Chip
                  label={teamDetail.pendingCount}
                  color={teamDetail.pendingCount > 0 ? 'warning' : 'default'}
                  size="small"
                />
              </Grid>
              <Grid item xs={6}>
                <Typography variant="body2" color="text.secondary">
                  Paralisadas
                </Typography>
                <Chip
                  label={teamDetail.paralyzedCount}
                  color={teamDetail.paralyzedCount > 0 ? 'error' : 'default'}
                  size="small"
                />
              </Grid>
              <Grid item xs={12}>
                <Typography variant="body2" color="text.secondary">
                  Taxa de paralisação
                </Typography>
                <Typography
                  variant="body1"
                  color={teamDetail.paralysisRatePercent > 0 ? 'error.main' : 'text.primary'}
                >
                  {teamDetail.paralysisRatePercent}%
                </Typography>
              </Grid>
            </Grid>
          )}
        </DialogContent>
      </Dialog>
    </Box>
  );
};

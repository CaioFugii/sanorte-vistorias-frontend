import {
  Box,
  Chip,
  CircularProgress,
  FormControl,
  IconButton,
  InputLabel,
  MenuItem,
  Select,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
  Tooltip,
} from "@mui/material";
import { Delete, Search } from "@mui/icons-material";
import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { InspectionListItem } from "@/domain";
import { InspectionStatus, ModuleType, UserRole } from "@/domain/enums";
import { appRepository } from "@/repositories/AppRepository";
import { useAuthStore } from "@/stores/authStore";
import { StatusChip } from "@/components/StatusChip";
import { PercentBadge } from "@/components/PercentBadge";
import { getModuleLabel } from "@/utils/moduleLabel";
import { ListPagination } from "@/components/ListPagination";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import {
  PageHeader,
  SectionTable,
  TableActionsCell,
  TableActionsGroup,
  TableActionsHeaderCell,
  TableEditButton,
  TableViewButton,
} from "@/components/ui";

const DEFAULT_LIMIT = 10;

interface InspectionsPageProps {
  moduleOptions?: ModuleType[];
  defaultModule?: ModuleType;
}

export const InspectionsPage = ({
  moduleOptions,
  defaultModule,
}: InspectionsPageProps = {}): JSX.Element => {
  const navigate = useNavigate();
  const location = useLocation();
  const detailFrom = `${location.pathname}${location.search}`;
  const { user, hasRole } = useAuthStore();
  const availableModules = moduleOptions && moduleOptions.length > 0
    ? moduleOptions
    : [
        ModuleType.CAMPO,
        ModuleType.REMOTO,
        ModuleType.POS_OBRA,
        ModuleType.OBRAS_INVESTIMENTO,
        ModuleType.SEGURANCA_TRABALHO,
      ];
  const initialSelectedModule: ModuleType | "" =
    defaultModule && availableModules.includes(defaultModule)
      ? defaultModule
      : moduleOptions && moduleOptions.length > 0
        ? moduleOptions[0]
        : "";
  const [selectedModule, setSelectedModule] = useState<ModuleType | "">(
    initialSelectedModule
  );
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(DEFAULT_LIMIT);
  const [osNumber, setOsNumber] = useState("");
  const [inspections, setInspections] = useState<InspectionListItem[]>([]);
  const [allForFiscal, setAllForFiscal] = useState<InspectionListItem[] | null>(null);
  const [refreshNonce, setRefreshNonce] = useState(0);
  const [meta, setMeta] = useState<{
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [deletingInspection, setDeletingInspection] = useState<InspectionListItem | null>(null);
  const [deleting, setDeleting] = useState(false);
  const isFiscal = hasRole("FISCAL" as any) && user;

  useEffect(() => {
    if (defaultModule && availableModules.includes(defaultModule)) {
      setSelectedModule(defaultModule);
      return;
    }
    if (moduleOptions && moduleOptions.length > 0) {
      if (!selectedModule || !availableModules.includes(selectedModule)) {
        setSelectedModule(moduleOptions[0]);
      }
      return;
    }
    if (selectedModule && !availableModules.includes(selectedModule)) {
      setSelectedModule("");
    }
  }, [defaultModule, availableModules, moduleOptions, selectedModule]);

  useEffect(() => {
    if (!isFiscal || !user) return;
    setLoading(true);
    appRepository
      .listInspectionsForFiscal(user.id)
      .then((all) => setAllForFiscal(all))
      .finally(() => setLoading(false));
  }, [isFiscal, user?.id, refreshNonce]);

  useEffect(() => {
    if (isFiscal) return;
    setAllForFiscal(null);
    setLoading(true);
    appRepository
      .getInspections({
        page,
        limit,
        osNumber: osNumber.trim() || undefined,
        module: selectedModule || undefined,
      })
      .then((res) => {
        setInspections(res.data);
        setMeta(res.meta);
      })
      .finally(() => setLoading(false));
  }, [isFiscal, page, limit, osNumber, refreshNonce, selectedModule]);

  useEffect(() => {
    if (allForFiscal === null) return;
    const normalizedSearch = osNumber.trim().toLowerCase();
    const filtered = normalizedSearch
      ? allForFiscal.filter((inspection) =>
          (inspection.serviceOrder?.osNumber ?? "").toLowerCase().includes(normalizedSearch)
        )
      : allForFiscal;
    const moduleFiltered = selectedModule
      ? filtered.filter((inspection) => inspection.module === selectedModule)
      : filtered;
    const total = moduleFiltered.length;
    const totalPages = Math.max(1, Math.ceil(total / limit));
    const start = (page - 1) * limit;
    setInspections(moduleFiltered.slice(start, start + limit));
    setMeta({
      page,
      limit,
      total,
      totalPages,
      hasNext: page < totalPages,
      hasPrev: page > 1,
    });
  }, [allForFiscal, page, limit, osNumber, selectedModule]);

  if (loading && !meta) {
    return (
      <Box display="flex" justifyContent="center" p={4}>
        <CircularProgress />
      </Box>
    );
  }

  const isAdminOrManager =
    user?.role === UserRole.ADMIN || user?.role === UserRole.GESTOR;
  const canDeleteInspection = (inspection: InspectionListItem): boolean =>
    inspection.status === InspectionStatus.RASCUNHO;

  const handleDeleteInspection = async () => {
    if (!deletingInspection || deleting) return;
    setDeleting(true);
    try {
      await appRepository.deleteInspection(deletingInspection.externalId);
      setDeletingInspection(null);
      setRefreshNonce((current) => current + 1);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <Box>
      <PageHeader
        eyebrow="Operação"
        title="Vistorias"
        subtitle="Acompanhe o andamento, status e desempenho das vistorias em campo."
      />

      <Box display="flex" gap={2} alignItems="center" mb={2} flexWrap="wrap">
        <TextField
          size="small"
          placeholder="Pesquisar por número da OS"
          value={osNumber}
          onChange={(e) => {
            setOsNumber(e.target.value);
            setPage(1);
          }}
          InputProps={{
            startAdornment: <Search sx={{ mr: 1, color: "action.disabled" }} />,
          }}
          sx={{ minWidth: 280 }}
        />
        {!isFiscal && (
          <FormControl size="small" sx={{ minWidth: 240 }}>
            <InputLabel>Módulo</InputLabel>
            <Select
              value={selectedModule}
              label="Módulo"
              onChange={(event) => {
                setSelectedModule(event.target.value as ModuleType | "");
                setPage(1);
              }}
            >
              <MenuItem value="">
                <em>Todos os módulos</em>
              </MenuItem>
              {availableModules.map((module) => (
                <MenuItem key={module} value={module}>
                  {getModuleLabel(module)}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        )}
      </Box>

      <SectionTable title="Lista de vistorias">
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Módulo</TableCell>
              <TableCell>OS / Obra</TableCell>
              <TableCell>Serviço</TableCell>
              <TableCell>Equipe</TableCell>
              <TableCell>Localização</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Percentual</TableCell>
              <TableCell>Data</TableCell>
              <TableActionsHeaderCell />
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={9} align="center" sx={{ py: 4 }}>
                  <CircularProgress size={32} />
                </TableCell>
              </TableRow>
            ) : inspections.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9} align="center" sx={{ py: 4 }}>
                  {osNumber.trim()
                    ? "Nenhuma vistoria encontrada para o número da OS informado."
                    : "Nenhuma vistoria encontrada."}
                </TableCell>
              </TableRow>
            ) : (
              inspections.map((inspection) => (
                <TableRow key={inspection.externalId}>
                  <TableCell>{getModuleLabel(inspection.module)}</TableCell>
                  <TableCell>
                    {inspection.serviceOrder?.osNumber ??
                      inspection.investmentWork?.workName ??
                      inspection.investmentWork?.name ??
                      "-"}
                  </TableCell>
                  <TableCell>{inspection.serviceDescription}</TableCell>
                  <TableCell>{inspection.team?.name || "-"}</TableCell>
                  <TableCell>{inspection.locationDescription || "-"}</TableCell>
                  <TableCell>
                    <Box display="flex" alignItems="center" gap={1} flexWrap="wrap">
                      <StatusChip status={inspection.status} />
                      {inspection.hasParalysisPenalty && (
                        <Chip size="small" label="Penalizada" color="warning" variant="outlined" />
                      )}
                    </Box>
                  </TableCell>
                  <TableCell>
                    {inspection.scorePercent !== undefined &&
                    inspection.scorePercent !== null ? (
                      <PercentBadge
                        percent={inspection.scorePercent}
                        size="small"
                      />
                    ) : (
                      "N/A"
                    )}
                  </TableCell>
                  <TableCell>
                    {inspection.finalizedAt
                      ? new Date(inspection.finalizedAt).toLocaleDateString(
                          "pt-BR",
                        )
                      : new Date(inspection.createdAt).toLocaleDateString(
                          "pt-BR",
                        )}
                  </TableCell>
                  <TableActionsCell>
                    <TableActionsGroup>
                      <TableViewButton
                      onClick={() =>
                        navigate(`/inspections/${inspection.externalId}`, {
                          state: { from: detailFrom },
                        })
                      }
                      />
                      {(isAdminOrManager || inspection.status === InspectionStatus.RASCUNHO) && (
                        <TableEditButton
                        onClick={() =>
                          navigate(
                            isAdminOrManager
                              ? `/inspections/${inspection.externalId}/manage`
                              : `/inspections/${inspection.externalId}/fill`
                          )
                        }
                        />
                      )}
                      {canDeleteInspection(inspection) && (
                        <Tooltip title="Excluir vistoria em rascunho">
                          <IconButton
                            size="small"
                            color="error"
                            onClick={() => setDeletingInspection(inspection)}
                          >
                            <Delete fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      )}
                    </TableActionsGroup>
                  </TableActionsCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
        {meta && meta.total > 0 && (
          <ListPagination
            meta={meta}
            onPageChange={setPage}
            onRowsPerPageChange={(newLimit) => {
              setLimit(newLimit);
              setPage(1);
            }}
            rowsPerPageOptions={[5, 10, 25, 50]}
            disabled={loading}
          />
        )}
      </SectionTable>
      <ConfirmDialog
        open={!!deletingInspection}
        title="Excluir vistoria em rascunho"
        description={`Deseja excluir a vistoria "${deletingInspection?.serviceDescription ?? ""}"? Esta ação não pode ser desfeita.`}
        confirmLabel="Excluir"
        loading={deleting}
        onClose={() => {
          if (deleting) return;
          setDeletingInspection(null);
        }}
        onConfirm={handleDeleteInspection}
      />
    </Box>
  );
};

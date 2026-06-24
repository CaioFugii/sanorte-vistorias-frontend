import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  FormControlLabel,
  FormLabel,
  Radio,
  RadioGroup,
  Switch,
  Tab,
  Tabs,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from "@mui/material";
import { Add } from "@mui/icons-material";
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Checklist, InspectionScope, PaginatedResponse, Sector } from "@/domain";
import { ModuleSelect } from "@/components/ModuleSelect";
import { SectorSelect } from "@/components/SectorSelect";
import { ModuleType, UserRole } from "@/domain/enums";
import { appRepository } from "@/repositories/AppRepository";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { ListPagination } from "@/components/ListPagination";
import {
  DataCard,
  PageHeader,
  SectionTable,
  TableActionsCell,
  TableActionsGroup,
  TableActionsHeaderCell,
  TableDeleteButton,
  TableEditButton,
  TableViewButton,
} from "@/components/ui";
import { useAuthStore } from "@/stores/authStore";
import { getModuleLabel } from "@/utils/moduleLabel";

const DEFAULT_LIMIT = 10;
const WORK_SAFETY_SECTOR_NAME = "SEGURANCA DO TRABALHO";

function countItems(checklist: Checklist): number {
  return checklist.sections.reduce((sum, section) => sum + section.items.length, 0);
}

export const ChecklistsPage = (): JSX.Element => {
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);
  const isSupervisor = user?.role === UserRole.SUPERVISOR;
  const [result, setResult] = useState<PaginatedResponse<Checklist> | null>(null);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(DEFAULT_LIMIT);
  const [sectors, setSectors] = useState<Sector[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [checklistDialogOpen, setChecklistDialogOpen] = useState(false);
  const [deletingChecklist, setDeletingChecklist] = useState<Checklist | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [savingChecklist, setSavingChecklist] = useState(false);
  const [sectorTab, setSectorTab] = useState("all");
  const [checklistModule, setChecklistModule] = useState<ModuleType | "">(ModuleType.CAMPO);
  const [checklistInspectionScope, setChecklistInspectionScope] = useState<InspectionScope>(InspectionScope.TEAM);
  const [checklistName, setChecklistName] = useState("");
  const [checklistDescription, setChecklistDescription] = useState("");
  const [checklistSectorId, setChecklistSectorId] = useState("");
  const [checklistActive, setChecklistActive] = useState(true);

  const isWorkSafetyChecklistModule = checklistModule === ModuleType.SEGURANCA_TRABALHO;
  const workSafetySectorId = useMemo(
    () =>
      sectors.find(
        (sector) =>
          sector.name
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "")
            .trim()
            .toUpperCase() === WORK_SAFETY_SECTOR_NAME
      )?.id ?? "",
    [sectors]
  );
  const checklistSectorOptions = useMemo(
    () =>
      sectors.filter((sector) => {
        const normalizedName = sector.name
          .normalize("NFD")
          .replace(/[\u0300-\u036f]/g, "")
          .trim()
          .toUpperCase();
        if (isWorkSafetyChecklistModule) {
          return normalizedName === WORK_SAFETY_SECTOR_NAME;
        }
        return normalizedName !== WORK_SAFETY_SECTOR_NAME;
      }),
    [sectors, isWorkSafetyChecklistModule]
  );

  const load = async () => {
    setLoading(true);
    try {
      if (!navigator.onLine) {
        throw new Error("Gestão de checklists está disponível apenas online.");
      }
      const [checklistsResponse, sectorsData] = await Promise.all([
        appRepository.getChecklists({
          page,
          limit,
          sectorId: sectorTab === "all" ? undefined : sectorTab,
        }),
        appRepository.loadSectors(true),
      ]);
      setResult(checklistsResponse);
      setSectors(sectorsData);
      setError(null);
    } catch (e) {
      setResult(null);
      setSectors((prev) => (prev.length === 0 ? [] : prev));
      setError(e instanceof Error ? e.message : "Não foi possível carregar checklists.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [page, limit, sectorTab]);

  useEffect(() => {
    if (sectorTab === "all") return;
    const exists = sectors.some((sector) => sector.id === sectorTab);
    if (!exists) {
      setSectorTab("all");
    }
  }, [sectors, sectorTab]);

  useEffect(() => {
    if (!isWorkSafetyChecklistModule || !workSafetySectorId) return;
    setChecklistSectorId((current) => (current === workSafetySectorId ? current : workSafetySectorId));
  }, [isWorkSafetyChecklistModule, workSafetySectorId]);

  useEffect(() => {
    if (isWorkSafetyChecklistModule) return;
    const selectedIsValid = checklistSectorOptions.some((sector) => sector.id === checklistSectorId);
    if (selectedIsValid) return;
    const fallbackSectorId = checklistSectorOptions.find((sector) => sector.active)?.id ?? checklistSectorOptions[0]?.id ?? "";
    setChecklistSectorId(fallbackSectorId);
  }, [isWorkSafetyChecklistModule, checklistSectorOptions, checklistSectorId]);

  const visibleChecklists = result?.data ?? [];
  const meta = result?.meta;

  const openCreateDialog = (): void => {
    setChecklistModule(ModuleType.CAMPO);
    setChecklistInspectionScope(InspectionScope.TEAM);
    setChecklistName("");
    setChecklistDescription("");
    setChecklistSectorId(sectors.find((sector) => sector.active)?.id ?? "");
    setChecklistActive(true);
    setChecklistDialogOpen(true);
  };

  if (loading && !result) {
    return (
      <Box display="flex" justifyContent="center" p={4}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <PageHeader
        eyebrow="Administração técnica"
        title="Checklists"
        subtitle="Cadastre checklists e estruture seções e perguntas no editor dedicado."
        actions={
          !isSupervisor ? (
            <Button variant="contained" startIcon={<Add />} onClick={openCreateDialog}>
              Novo checklist
            </Button>
          ) : undefined
        }
      />
      {error && (
        <Alert severity="warning" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <DataCard>
        <Tabs
          value={sectorTab}
          onChange={(_, value: string) => {
            setSectorTab(value);
            setPage(1);
          }}
          variant="scrollable"
          scrollButtons="auto"
        >
          <Tab value="all" label="Todos" />
          {sectors.map((sector) => (
            <Tab key={sector.id} value={sector.id} label={sector.name} />
          ))}
        </Tabs>
      </DataCard>

      <SectionTable title="Lista de checklists">
        {loading ? (
          <Box display="flex" justifyContent="center" py={4}>
            <CircularProgress size={32} />
          </Box>
        ) : visibleChecklists.length === 0 ? (
          <Box py={4} textAlign="center">
            <Typography color="text.secondary">Nenhum checklist encontrado.</Typography>
          </Box>
        ) : (
          <>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Nome</TableCell>
                  <TableCell>Módulo</TableCell>
                  <TableCell>Setor</TableCell>
                  <TableCell>Seções</TableCell>
                  <TableCell>Perguntas</TableCell>
                  <TableCell>Status</TableCell>
                  <TableActionsHeaderCell />
                </TableRow>
              </TableHead>
              <TableBody>
                {visibleChecklists.map((checklist) => (
                  <TableRow key={checklist.id} hover>
                    <TableCell>
                      <Typography fontWeight={600}>{checklist.name}</Typography>
                      {checklist.description && (
                        <Typography variant="caption" color="text.secondary" display="block">
                          {checklist.description}
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell>{getModuleLabel(checklist.module)}</TableCell>
                    <TableCell>{checklist.sector?.name ?? "—"}</TableCell>
                    <TableCell>{checklist.sections.length}</TableCell>
                    <TableCell>{countItems(checklist)}</TableCell>
                    <TableCell>
                      <Chip
                        label={checklist.active ? "Ativo" : "Inativo"}
                        size="small"
                        color={checklist.active ? "success" : "default"}
                      />
                    </TableCell>
                    <TableActionsCell>
                      <TableActionsGroup>
                        {isSupervisor ? (
                          <TableViewButton
                            label="Ver"
                            onClick={() => navigate(`/checklists/${checklist.id}/edit`)}
                          />
                        ) : (
                          <>
                            <TableEditButton onClick={() => navigate(`/checklists/${checklist.id}/edit`)} />
                            <TableDeleteButton onClick={() => setDeletingChecklist(checklist)} />
                          </>
                        )}
                      </TableActionsGroup>
                    </TableActionsCell>
                  </TableRow>
                ))}
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
                rowsPerPageOptions={[10, 20, 50, 100]}
                disabled={loading}
              />
            )}
          </>
        )}
      </SectionTable>

      <Dialog open={checklistDialogOpen && !isSupervisor} onClose={() => setChecklistDialogOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle>Novo checklist</DialogTitle>
        <DialogContent>
          <Box mt={2}>
            <ModuleSelect
              value={checklistModule}
              onChange={(value) => {
                setChecklistModule(value);
                if (value !== ModuleType.SEGURANCA_TRABALHO) {
                  setChecklistInspectionScope(InspectionScope.TEAM);
                }
              }}
            />
          </Box>
          {isWorkSafetyChecklistModule && (
            <Box mt={2}>
              <FormControl required>
                <FormLabel id="checklist-inspection-scope-label">Escopo atendido</FormLabel>
                <RadioGroup
                  row
                  aria-labelledby="checklist-inspection-scope-label"
                  value={checklistInspectionScope}
                  onChange={(event) => setChecklistInspectionScope(event.target.value as InspectionScope)}
                >
                  <FormControlLabel value={InspectionScope.TEAM} control={<Radio />} label="Equipe" />
                  <FormControlLabel value={InspectionScope.COLLABORATOR} control={<Radio />} label="Colaborador" />
                </RadioGroup>
              </FormControl>
            </Box>
          )}
          <Box mt={2}>
            <SectorSelect
              value={checklistSectorId}
              onChange={setChecklistSectorId}
              options={checklistSectorOptions}
              required
              disabled={isWorkSafetyChecklistModule && Boolean(workSafetySectorId)}
            />
          </Box>
          <TextField
            margin="normal"
            fullWidth
            label="Nome"
            value={checklistName}
            onChange={(e) => setChecklistName(e.target.value)}
          />
          <TextField
            margin="normal"
            fullWidth
            label="Descrição"
            value={checklistDescription}
            onChange={(e) => setChecklistDescription(e.target.value)}
          />
          <FormControlLabel
            control={<Switch checked={checklistActive} onChange={(e) => setChecklistActive(e.target.checked)} />}
            label="Ativo"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setChecklistDialogOpen(false)} disabled={savingChecklist}>Cancelar</Button>
          <Button
            variant="contained"
            disabled={!checklistName.trim() || !checklistModule || !checklistSectorId || savingChecklist}
            onClick={async () => {
              if (!checklistModule || !checklistSectorId || savingChecklist) return;
              setSavingChecklist(true);
              try {
                const inspectionScope =
                  checklistModule === ModuleType.SEGURANCA_TRABALHO
                    ? checklistInspectionScope
                    : InspectionScope.TEAM;
                const created = await appRepository.createChecklist({
                  module: checklistModule,
                  inspectionScope,
                  name: checklistName,
                  description: checklistDescription || undefined,
                  sectorId: checklistSectorId,
                  active: checklistActive,
                });
                setChecklistDialogOpen(false);
                navigate(`/checklists/${created.id}/edit`);
              } finally {
                setSavingChecklist(false);
              }
            }}
          >
            Salvar
          </Button>
        </DialogActions>
      </Dialog>

      <ConfirmDialog
        open={!!deletingChecklist && !isSupervisor}
        title="Excluir checklist"
        description={`Deseja excluir o checklist "${deletingChecklist?.name ?? ""}"?`}
        confirmLabel="Excluir"
        loading={deleting}
        onClose={() => {
          if (deleting) return;
          setDeletingChecklist(null);
        }}
        onConfirm={async () => {
          if (!deletingChecklist || deleting) return;
          setDeleting(true);
          try {
            await appRepository.deleteChecklist(deletingChecklist.id);
            setDeletingChecklist(null);
            await load();
          } finally {
            setDeleting(false);
          }
        }}
      />
    </Box>
  );
};

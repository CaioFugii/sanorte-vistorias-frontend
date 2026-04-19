import {
  Alert,
  Box,
  Button,
  FormControl,
  FormLabel,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControlLabel,
  IconButton,
  Paper,
  Switch,
  TextField,
  Typography,
  CircularProgress,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Chip,
  Tab,
  Tabs,
  RadioGroup,
  Radio,
} from '@mui/material';
import {
  Add,
  AddAPhoto,
  Delete,
  Edit,
  Refresh,
  ExpandMore,
} from '@mui/icons-material';
import { ChangeEvent, useState, useEffect, useMemo } from 'react';
import { Checklist, InspectionScope, PaginatedResponse, Sector } from '@/domain';
import { ModuleSelect } from '@/components/ModuleSelect';
import { SectorSelect } from '@/components/SectorSelect';
import { ModuleType } from '@/domain/enums';
import { appRepository } from '@/repositories/AppRepository';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { ListPagination } from '@/components/ListPagination';
import { DataCard, PageHeader } from '@/components/ui';
import {
  prepareImageForUpload,
  PREPARE_IMAGE_MAX_BYTES_UPLOADS,
} from '@/utils/prepareImageForUpload';

const DEFAULT_LIMIT = 10;
const WORK_SAFETY_SECTOR_NAME = "SEGURANCA DO TRABALHO";
/** Tamanho máximo do arquivo escolhido antes da compressão (memória). */
const MAX_REFERENCE_IMAGE_INPUT_SIZE = 32 * 1024 * 1024;
const ALLOWED_REFERENCE_IMAGE_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/webp"];

export const ChecklistsPage = (): JSX.Element => {
  const [result, setResult] = useState<PaginatedResponse<Checklist> | null>(null);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(DEFAULT_LIMIT);
  const [sectors, setSectors] = useState<Sector[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [checklistDialogOpen, setChecklistDialogOpen] = useState(false);
  const [sectionDialogOpen, setSectionDialogOpen] = useState(false);
  const [itemDialogOpen, setItemDialogOpen] = useState(false);
  const [editingChecklist, setEditingChecklist] = useState<Checklist | null>(null);
  const [deletingChecklist, setDeletingChecklist] = useState<Checklist | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [savingChecklist, setSavingChecklist] = useState(false);
  const [savingItem, setSavingItem] = useState(false);
  const [selectedChecklist, setSelectedChecklist] = useState<Checklist | null>(null);
  const [selectedSectionId, setSelectedSectionId] = useState<string>("");
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [sectorTab, setSectorTab] = useState("all");
  const [checklistModule, setChecklistModule] = useState<ModuleType | ''>(ModuleType.CAMPO);
  const [checklistInspectionScope, setChecklistInspectionScope] = useState<InspectionScope>(InspectionScope.TEAM);
  const [checklistName, setChecklistName] = useState("");
  const [checklistDescription, setChecklistDescription] = useState("");
  const [checklistSectorId, setChecklistSectorId] = useState("");
  const [checklistActive, setChecklistActive] = useState(true);
  const [sectionName, setSectionName] = useState("");
  const [sectionOrder, setSectionOrder] = useState(1);
  const [sectionActive, setSectionActive] = useState(true);
  const [itemTitle, setItemTitle] = useState("");
  const [itemDescription, setItemDescription] = useState("");
  const [itemOrder, setItemOrder] = useState(1);
  const [itemRequiresPhoto, setItemRequiresPhoto] = useState(true);
  const [itemActive, setItemActive] = useState(true);
  const [itemReferenceImageFile, setItemReferenceImageFile] = useState<File | null>(null);
  const [itemReferenceImagePreview, setItemReferenceImagePreview] = useState<string | null>(null);
  const [itemReferenceImageError, setItemReferenceImageError] = useState<string | null>(null);
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

  const clearReferenceImageState = (): void => {
    setItemReferenceImageFile(null);
    setItemReferenceImagePreview(null);
    setItemReferenceImageError(null);
  };

  const readFileAsDataUrl = (file: File): Promise<string> =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve((reader.result as string) ?? "");
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });

  const handleReferenceImageChange = async (event: ChangeEvent<HTMLInputElement>): Promise<void> => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    if (!ALLOWED_REFERENCE_IMAGE_TYPES.includes(file.type)) {
      setItemReferenceImageError("Formato inválido. Use JPG, PNG ou WEBP.");
      return;
    }

    if (file.size > MAX_REFERENCE_IMAGE_INPUT_SIZE) {
      setItemReferenceImageError("Imagem muito grande (máx. ~32MB antes da otimização).");
      return;
    }

    const prepared = await prepareImageForUpload(file, {
      maxBytes: PREPARE_IMAGE_MAX_BYTES_UPLOADS,
    });
    if (prepared.size > PREPARE_IMAGE_MAX_BYTES_UPLOADS) {
      setItemReferenceImageError("Não foi possível reduzir a imagem para o limite aceito pelo servidor.");
      return;
    }

    setItemReferenceImageError(null);
    setItemReferenceImageFile(prepared);
    setItemReferenceImagePreview(await readFileAsDataUrl(prepared));
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
        subtitle="Estruture checklists por setor e módulo para padronizar inspeções."
        actions={
          <Box display="flex" gap={1}>
            <Button
              variant="outlined"
              startIcon={<Refresh />}
              onClick={load}
            >
              Atualizar catálogo
            </Button>
            <Button
              variant="contained"
              startIcon={<Add />}
              onClick={() => {
                setEditingChecklist(null);
                setChecklistModule(ModuleType.CAMPO);
                setChecklistInspectionScope(InspectionScope.TEAM);
                setChecklistName("");
                setChecklistDescription("");
                setChecklistSectorId(sectors.find((sector) => sector.active)?.id ?? "");
                setChecklistActive(true);
                setChecklistDialogOpen(true);
              }}
            >
              Novo checklist
            </Button>
          </Box>
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
      {visibleChecklists.map((checklist: Checklist) => (
        <Accordion key={checklist.id} sx={{ mb: 1 }}>
            <AccordionSummary expandIcon={<ExpandMore />}>
              <Box
                sx={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  width: '100%',
                  mr: 2,
                }}
              >
                <Typography variant="h6">{checklist.name} ({checklist.module})</Typography>
                <Box>
                  {checklist.sector && (
                    <Chip label={checklist.sector.name} size="small" color="info" sx={{ mr: 1 }} />
                  )}
                  <Chip
                    label={checklist.active ? 'Ativo' : 'Inativo'}
                    size="small"
                    color={checklist.active ? 'success' : 'default'}
                  />
                  <IconButton
                    size="small"
                    onClick={(event) => {
                      event.stopPropagation();
                      setEditingChecklist(checklist);
                      setChecklistModule(checklist.module);
                      setChecklistInspectionScope(checklist.inspectionScope ?? InspectionScope.TEAM);
                      setChecklistName(checklist.name);
                      setChecklistDescription(checklist.description || "");
                      setChecklistSectorId(checklist.sectorId);
                      setChecklistActive(checklist.active);
                      setChecklistDialogOpen(true);
                    }}
                  >
                    <Edit />
                  </IconButton>
                  <IconButton
                    size="small"
                    color="error"
                    onClick={(event) => {
                      event.stopPropagation();
                      setDeletingChecklist(checklist);
                    }}
                  >
                    <Delete />
                  </IconButton>
                </Box>
              </Box>
            </AccordionSummary>
            <AccordionDetails>
              <Box display="flex" justifyContent="flex-end" mb={2}>
                <Button
                  startIcon={<Add />}
                  onClick={() => {
                    setSelectedChecklist(checklist);
                    setSectionName("");
                    setSectionOrder(
                      (checklist.sections.reduce((max, section) => Math.max(max, section.order), 0) || 0) + 1
                    );
                    setSectionActive(true);
                    setSectionDialogOpen(true);
                  }}
                >
                  Nova seção
                </Button>
              </Box>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                {checklist.description}
              </Typography>
              {checklist.sections.map((section) => (
                <Paper key={section.id} sx={{ p: 2, mb: 1 }} variant="outlined">
                  <Box display="flex" justifyContent="space-between" alignItems="center">
                    <Typography fontWeight={600}>{section.title ?? section.name}</Typography>
                    <Box>
                      <IconButton
                        size="small"
                        onClick={() => {
                          setSelectedChecklist(checklist);
                          setSelectedSectionId(section.id);
                          setSectionName(section.title ?? section.name);
                          setSectionOrder(section.order);
                          setSectionActive(section.active ?? true);
                          setSectionDialogOpen(true);
                        }}
                      >
                        <Edit />
                      </IconButton>
                      <IconButton
                        size="small"
                        onClick={() => {
                          setSelectedChecklist(checklist);
                          setSelectedSectionId(section.id);
                          setEditingItemId(null);
                          setItemTitle("");
                          setItemDescription("");
                          setItemOrder(
                            (section.items.reduce((max, item) => Math.max(max, item.order), 0) || 0) + 1
                          );
                          setItemRequiresPhoto(true);
                          setItemActive(true);
                          clearReferenceImageState();
                          setItemDialogOpen(true);
                        }}
                      >
                        <Add />
                      </IconButton>
                    </Box>
                  </Box>
                  {section.items
                    .sort((a, b) => a.order - b.order)
                    .map((item) => (
                      <Box key={item.id} display="flex" justifyContent="space-between" alignItems="center">
                        <Typography variant="body2">
                          - {item.order}. {item.title}
                        </Typography>
                        <Box>
                          <IconButton
                            size="small"
                            onClick={() => {
                              setSelectedChecklist(checklist);
                              setSelectedSectionId(section.id);
                              setEditingItemId(item.id);
                              setItemTitle(item.title);
                              setItemDescription(item.description || "");
                              setItemOrder(item.order);
                              setItemRequiresPhoto(item.requiresPhotoOnNonConformity);
                              setItemActive(item.active);
                              setItemReferenceImageFile(null);
                              setItemReferenceImagePreview(item.referenceImageUrl ?? null);
                              setItemReferenceImageError(null);
                              setItemDialogOpen(true);
                            }}
                          >
                            <Edit />
                          </IconButton>
                          <IconButton
                            size="small"
                            color="error"
                            onClick={async () => {
                              await appRepository.deleteChecklistItem(checklist.id, item.id);
                              await load();
                            }}
                          >
                            <Delete />
                          </IconButton>
                        </Box>
                      </Box>
                    ))}
                </Paper>
              ))}
            </AccordionDetails>
          </Accordion>
      ))}
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
      </>
      )}

      <Dialog open={checklistDialogOpen} onClose={() => setChecklistDialogOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle>{editingChecklist ? "Editar checklist" : "Novo checklist"}</DialogTitle>
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
                if (editingChecklist) {
                  const updateChecklistInput = {
                    module: checklistModule,
                    inspectionScope,
                    name: checklistName,
                    description: checklistDescription || undefined,
                    sectorId: checklistSectorId,
                    active: checklistActive,
                  };
                  await appRepository.updateChecklist(editingChecklist.id, updateChecklistInput);
                } else {
                  await appRepository.createChecklist({
                    module: checklistModule,
                    inspectionScope,
                    name: checklistName,
                    description: checklistDescription || undefined,
                    sectorId: checklistSectorId,
                    active: checklistActive,
                  });
                }
                setChecklistDialogOpen(false);
                await load();
              } finally {
                setSavingChecklist(false);
              }
            }}
          >
            Salvar
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={sectionDialogOpen} onClose={() => setSectionDialogOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle>{selectedSectionId ? "Editar seção" : "Nova seção"}</DialogTitle>
        <DialogContent>
          <TextField
            margin="normal"
            fullWidth
            label="Nome"
            value={sectionName}
            onChange={(e) => setSectionName(e.target.value)}
          />
          <TextField
            margin="normal"
            fullWidth
            label="Ordem"
            type="number"
            value={sectionOrder}
            onChange={(e) => setSectionOrder(Number(e.target.value || 1))}
          />
          <FormControlLabel
            control={<Switch checked={sectionActive} onChange={(e) => setSectionActive(e.target.checked)} />}
            label="Ativa"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSectionDialogOpen(false)}>Cancelar</Button>
          <Button
            variant="contained"
            disabled={!selectedChecklist || !sectionName.trim()}
            onClick={async () => {
              if (!selectedChecklist) return;
              if (selectedSectionId) {
                await appRepository.updateChecklistSection(selectedChecklist.id, selectedSectionId, {
                  name: sectionName,
                  order: sectionOrder,
                  active: sectionActive,
                });
              } else {
                await appRepository.createChecklistSection(selectedChecklist.id, {
                  name: sectionName,
                  order: sectionOrder,
                  active: sectionActive,
                });
              }
              setSectionDialogOpen(false);
              setSelectedSectionId("");
              await load();
            }}
          >
            Salvar
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={itemDialogOpen}
        onClose={() => {
          setItemDialogOpen(false);
          clearReferenceImageState();
        }}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle>{editingItemId ? "Editar item" : "Novo item"}</DialogTitle>
        <DialogContent>
          <TextField
            margin="normal"
            fullWidth
            label="Título"
            value={itemTitle}
            onChange={(e) => setItemTitle(e.target.value)}
          />
          <TextField
            margin="normal"
            fullWidth
            label="Descrição"
            value={itemDescription}
            onChange={(e) => setItemDescription(e.target.value)}
          />
          <TextField
            margin="normal"
            fullWidth
            label="Ordem"
            type="number"
            value={itemOrder}
            onChange={(e) => setItemOrder(Number(e.target.value || 1))}
          />
          <FormControlLabel
            control={
              <Switch
                checked={itemRequiresPhoto}
                onChange={(e) => setItemRequiresPhoto(e.target.checked)}
              />
            }
            label="Requer foto em não conformidade"
          />
          <Box mt={1}>
            <Button
              variant="outlined"
              component="label"
              startIcon={<AddAPhoto />}
              fullWidth
            >
              {itemReferenceImageFile ? "Trocar foto de referência" : "Adicionar foto de referência (opcional)"}
              <input
                hidden
                type="file"
                accept={ALLOWED_REFERENCE_IMAGE_TYPES.join(",")}
                onChange={(event) => {
                  void handleReferenceImageChange(event);
                }}
              />
            </Button>
            {(itemReferenceImagePreview || itemReferenceImageFile) && (
              <Box mt={1}>
                <Box
                  component="img"
                  src={itemReferenceImagePreview ?? undefined}
                  alt="Foto de referência do item"
                  sx={{ width: "100%", maxHeight: 220, objectFit: "contain", borderRadius: 1 }}
                />
                {itemReferenceImageFile && (
                  <Typography variant="caption" color="text.secondary" display="block" mt={0.5}>
                    Arquivo selecionado: {itemReferenceImageFile.name}
                  </Typography>
                )}
                <Button
                  size="small"
                  color="inherit"
                  sx={{ mt: 1 }}
                  onClick={clearReferenceImageState}
                >
                  Remover seleção
                </Button>
              </Box>
            )}
            {itemReferenceImageError && (
              <Typography variant="caption" color="error" display="block" mt={1}>
                {itemReferenceImageError}
              </Typography>
            )}
          </Box>
          <FormControlLabel
            control={<Switch checked={itemActive} onChange={(e) => setItemActive(e.target.checked)} />}
            label="Ativo"
          />
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => {
              setItemDialogOpen(false);
              clearReferenceImageState();
            }}
            disabled={savingItem}
          >
            Cancelar
          </Button>
          <Button
            variant="contained"
            disabled={!selectedChecklist || !selectedSectionId || !itemTitle.trim() || savingItem}
            onClick={async () => {
              if (!selectedChecklist || !selectedSectionId || savingItem) return;
              setSavingItem(true);
              try {
                if (editingItemId) {
                  await appRepository.updateChecklistItem(selectedChecklist.id, editingItemId, {
                    title: itemTitle,
                    description: itemDescription || undefined,
                    order: itemOrder,
                    requiresPhotoOnNonConformity: itemRequiresPhoto,
                    active: itemActive,
                  });
                  if (itemReferenceImageFile) {
                    await appRepository.uploadChecklistItemReferenceImage(
                      selectedChecklist.id,
                      editingItemId,
                      itemReferenceImageFile
                    );
                  }
                } else {
                  const createdItem = await appRepository.createChecklistItem(selectedChecklist.id, {
                    title: itemTitle,
                    description: itemDescription || undefined,
                    order: itemOrder,
                    sectionId: selectedSectionId,
                    requiresPhotoOnNonConformity: itemRequiresPhoto,
                    active: itemActive,
                  });
                  if (itemReferenceImageFile) {
                    await appRepository.uploadChecklistItemReferenceImage(
                      selectedChecklist.id,
                      createdItem.id,
                      itemReferenceImageFile
                    );
                  }
                }
                setItemDialogOpen(false);
                setEditingItemId(null);
                clearReferenceImageState();
                await load();
              } finally {
                setSavingItem(false);
              }
            }}
          >
            Salvar
          </Button>
        </DialogActions>
      </Dialog>
      <ConfirmDialog
        open={!!deletingChecklist}
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

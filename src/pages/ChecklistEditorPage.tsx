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
  IconButton,
  Paper,
  Radio,
  RadioGroup,
  Switch,
  TextField,
  Typography,
} from "@mui/material";
import {
  Add,
  AddAPhoto,
  ArrowBack,
  Delete,
  Edit,
} from "@mui/icons-material";
import { ChangeEvent, useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Checklist, ChecklistItem, ChecklistSection, InspectionScope, Sector } from "@/domain";
import { ModuleType, UserRole } from "@/domain/enums";
import { ModuleSelect } from "@/components/ModuleSelect";
import { SectorSelect } from "@/components/SectorSelect";
import { appRepository } from "@/repositories/AppRepository";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { useAuthStore } from "@/stores/authStore";
import { getModuleLabel } from "@/utils/moduleLabel";
import {
  prepareImageForUpload,
  PREPARE_IMAGE_MAX_BYTES_UPLOADS,
} from "@/utils/prepareImageForUpload";

const MAX_REFERENCE_IMAGE_INPUT_SIZE = 32 * 1024 * 1024;
const ALLOWED_REFERENCE_IMAGE_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
const WORK_SAFETY_SECTOR_NAME = "SEGURANCA DO TRABALHO";

function normalizeSection(section: ChecklistSection): ChecklistSection {
  return {
    ...section,
    title: section.title ?? section.name,
    items: [...(section.items || [])].sort((a, b) => a.order - b.order),
  };
}

function sortSections(sections: ChecklistSection[]): ChecklistSection[] {
  return [...sections].map(normalizeSection).sort((a, b) => a.order - b.order);
}

export const ChecklistEditorPage = (): JSX.Element => {
  const { id } = useParams();
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);
  const readOnly = user?.role === UserRole.SUPERVISOR;

  const [checklist, setChecklist] = useState<Checklist | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [sectionDialogOpen, setSectionDialogOpen] = useState(false);
  const [editingSectionId, setEditingSectionId] = useState<string | null>(null);
  const [sectionName, setSectionName] = useState("");
  const [sectionOrder, setSectionOrder] = useState(1);
  const [sectionActive, setSectionActive] = useState(true);
  const [savingSection, setSavingSection] = useState(false);

  const [itemDialogOpen, setItemDialogOpen] = useState(false);
  const [itemSectionId, setItemSectionId] = useState("");
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [itemTitle, setItemTitle] = useState("");
  const [itemDescription, setItemDescription] = useState("");
  const [itemOrder, setItemOrder] = useState(1);
  const [itemRequiresPhoto, setItemRequiresPhoto] = useState(true);
  const [itemActive, setItemActive] = useState(true);
  const [itemReferenceImageFile, setItemReferenceImageFile] = useState<File | null>(null);
  const [itemReferenceImagePreview, setItemReferenceImagePreview] = useState<string | null>(null);
  const [itemReferenceImageError, setItemReferenceImageError] = useState<string | null>(null);
  const [savingItem, setSavingItem] = useState(false);

  const [deletingSection, setDeletingSection] = useState<ChecklistSection | null>(null);
  const [deletingSectionLoading, setDeletingSectionLoading] = useState(false);
  const [deletingItem, setDeletingItem] = useState<{ sectionId: string; item: ChecklistItem } | null>(null);
  const [deletingItemLoading, setDeletingItemLoading] = useState(false);

  const [sectors, setSectors] = useState<Sector[]>([]);
  const [metadataDialogOpen, setMetadataDialogOpen] = useState(false);
  const [metadataModule, setMetadataModule] = useState<ModuleType | "">(ModuleType.CAMPO);
  const [metadataInspectionScope, setMetadataInspectionScope] = useState<InspectionScope>(InspectionScope.TEAM);
  const [metadataName, setMetadataName] = useState("");
  const [metadataDescription, setMetadataDescription] = useState("");
  const [metadataSectorId, setMetadataSectorId] = useState("");
  const [metadataActive, setMetadataActive] = useState(true);
  const [savingMetadata, setSavingMetadata] = useState(false);

  const isWorkSafetyModule = metadataModule === ModuleType.SEGURANCA_TRABALHO;
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
  const metadataSectorOptions = useMemo(
    () =>
      sectors.filter((sector) => {
        const normalizedName = sector.name
          .normalize("NFD")
          .replace(/[\u0300-\u036f]/g, "")
          .trim()
          .toUpperCase();
        if (isWorkSafetyModule) {
          return normalizedName === WORK_SAFETY_SECTOR_NAME;
        }
        return normalizedName !== WORK_SAFETY_SECTOR_NAME;
      }),
    [sectors, isWorkSafetyModule]
  );

  const refreshReferenceChecklists = useCallback(async () => {
    try {
      await appRepository.loadChecklists(true);
    } catch {
      // Falha silenciosa — cache de referência será atualizado na próxima carga.
    }
  }, []);

  const loadChecklist = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    try {
      if (!navigator.onLine) {
        throw new Error("Edição de checklist está disponível apenas online.");
      }
      const data = await appRepository.getChecklist(id);
      setChecklist({ ...data, sections: sortSections(data.sections) });
      setError(null);
    } catch (e) {
      setChecklist(null);
      setError(e instanceof Error ? e.message : "Não foi possível carregar o checklist.");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadChecklist();
  }, [loadChecklist]);

  useEffect(() => {
    appRepository.loadSectors(true).then(setSectors).catch(() => setSectors([]));
  }, []);

  useEffect(() => {
    if (!isWorkSafetyModule || !workSafetySectorId) return;
    setMetadataSectorId((current) => (current === workSafetySectorId ? current : workSafetySectorId));
  }, [isWorkSafetyModule, workSafetySectorId]);

  useEffect(() => {
    if (isWorkSafetyModule) return;
    const selectedIsValid = metadataSectorOptions.some((sector) => sector.id === metadataSectorId);
    if (selectedIsValid) return;
    const fallbackSectorId =
      metadataSectorOptions.find((sector) => sector.active)?.id ?? metadataSectorOptions[0]?.id ?? "";
    setMetadataSectorId(fallbackSectorId);
  }, [isWorkSafetyModule, metadataSectorOptions, metadataSectorId]);

  useEffect(() => {
    return () => {
      void refreshReferenceChecklists();
    };
  }, [refreshReferenceChecklists]);

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

  const openNewSectionDialog = (): void => {
    if (!checklist) return;
    setEditingSectionId(null);
    setSectionName("");
    setSectionOrder(
      (checklist.sections.reduce((max, section) => Math.max(max, section.order), 0) || 0) + 1
    );
    setSectionActive(true);
    setSectionDialogOpen(true);
  };

  const openEditSectionDialog = (section: ChecklistSection): void => {
    setEditingSectionId(section.id);
    setSectionName(section.title ?? section.name);
    setSectionOrder(section.order);
    setSectionActive(section.active ?? true);
    setSectionDialogOpen(true);
  };

  const upsertSectionInState = (section: ChecklistSection): void => {
    setChecklist((current) => {
      if (!current) return current;
      const normalized = normalizeSection({ ...section, items: section.items ?? [] });
      const exists = current.sections.some((s) => s.id === normalized.id);
      const sections = exists
        ? current.sections.map((s) => (s.id === normalized.id ? { ...normalized, items: s.items } : s))
        : [...current.sections, normalized];
      return { ...current, sections: sortSections(sections) };
    });
  };

  const removeSectionFromState = (sectionId: string): void => {
    setChecklist((current) => {
      if (!current) return current;
      return {
        ...current,
        sections: current.sections.filter((section) => section.id !== sectionId),
      };
    });
  };

  const openNewItemDialog = (section: ChecklistSection): void => {
    setItemSectionId(section.id);
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
  };

  const openEditItemDialog = (sectionId: string, item: ChecklistItem): void => {
    setItemSectionId(sectionId);
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
  };

  const upsertItemInState = (sectionId: string, item: ChecklistItem): void => {
    setChecklist((current) => {
      if (!current) return current;
      return {
        ...current,
        sections: current.sections.map((section) => {
          if (section.id !== sectionId) return section;
          const exists = section.items.some((existing) => existing.id === item.id);
          const items = exists
            ? section.items.map((existing) => (existing.id === item.id ? item : existing))
            : [...section.items, item];
          return normalizeSection({ ...section, items });
        }),
      };
    });
  };

  const removeItemFromState = (sectionId: string, itemId: string): void => {
    setChecklist((current) => {
      if (!current) return current;
      return {
        ...current,
        sections: current.sections.map((section) => {
          if (section.id !== sectionId) return section;
          return normalizeSection({
            ...section,
            items: section.items.filter((item) => item.id !== itemId),
          });
        }),
      };
    });
  };

  const handleBack = (): void => {
    void refreshReferenceChecklists();
    navigate("/checklists");
  };

  const openMetadataDialog = (): void => {
    if (!checklist) return;
    setMetadataModule(checklist.module);
    setMetadataInspectionScope(checklist.inspectionScope ?? InspectionScope.TEAM);
    setMetadataName(checklist.name);
    setMetadataDescription(checklist.description || "");
    setMetadataSectorId(checklist.sectorId);
    setMetadataActive(checklist.active);
    setMetadataDialogOpen(true);
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" p={4}>
        <CircularProgress />
      </Box>
    );
  }

  if (!checklist) {
    return (
      <Box>
        <Button startIcon={<ArrowBack />} onClick={handleBack} sx={{ mb: 2 }}>
          Voltar
        </Button>
        <Alert severity="warning">{error ?? "Checklist não encontrado."}</Alert>
      </Box>
    );
  }

  const sections = sortSections(checklist.sections);
  const totalItems = sections.reduce((sum, section) => sum + section.items.length, 0);

  return (
    <Box>
      <Box display="flex" alignItems="flex-start" gap={2} mb={3}>
        <Button startIcon={<ArrowBack />} onClick={handleBack} sx={{ mt: 0.5 }}>
          Voltar
        </Button>
        <Box flex={1}>
          <Typography variant="overline" sx={{ color: "primary.main", letterSpacing: 1 }}>
            {readOnly ? "Visualização" : "Editor de checklist"}
          </Typography>
          <Typography variant="h4">{checklist.name}</Typography>
          {checklist.description && (
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
              {checklist.description}
            </Typography>
          )}
          <Box display="flex" flexWrap="wrap" gap={1} mt={1.5}>
            <Chip label={getModuleLabel(checklist.module)} size="small" color="primary" variant="outlined" />
            {checklist.sector && (
              <Chip label={checklist.sector.name} size="small" color="info" variant="outlined" />
            )}
            <Chip
              label={checklist.active ? "Ativo" : "Inativo"}
              size="small"
              color={checklist.active ? "success" : "default"}
            />
            <Chip label={`${sections.length} seções`} size="small" variant="outlined" />
            <Chip label={`${totalItems} perguntas`} size="small" variant="outlined" />
          </Box>
        </Box>
        {!readOnly && (
          <Box display="flex" gap={1}>
            <Button variant="outlined" startIcon={<Edit />} onClick={openMetadataDialog}>
              Editar informações
            </Button>
            <Button variant="contained" startIcon={<Add />} onClick={openNewSectionDialog}>
              Nova seção
            </Button>
          </Box>
        )}
      </Box>

      {error && (
        <Alert severity="warning" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {sections.length === 0 ? (
        <Paper variant="outlined" sx={{ p: 4, textAlign: "center" }}>
          <Typography color="text.secondary" gutterBottom>
            Este checklist ainda não tem seções.
          </Typography>
          {!readOnly && (
            <Button variant="contained" startIcon={<Add />} onClick={openNewSectionDialog} sx={{ mt: 1 }}>
              Adicionar primeira seção
            </Button>
          )}
        </Paper>
      ) : (
        sections.map((section) => (
          <Paper key={section.id} variant="outlined" sx={{ p: 2, mb: 2 }}>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
              <Box>
                <Typography fontWeight={600} variant="h6">
                  {section.title ?? section.name}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Ordem {section.order}
                  {section.active === false ? " · Inativa" : ""}
                  {" · "}
                  {section.items.length} pergunta(s)
                </Typography>
              </Box>
              {!readOnly && (
                <Box>
                  <IconButton size="small" onClick={() => openEditSectionDialog(section)} aria-label="Editar seção">
                    <Edit />
                  </IconButton>
                  <IconButton
                    size="small"
                    color="error"
                    onClick={() => setDeletingSection(section)}
                    aria-label="Excluir seção"
                  >
                    <Delete />
                  </IconButton>
                  <IconButton
                    size="small"
                    onClick={() => openNewItemDialog(section)}
                    aria-label="Nova pergunta"
                  >
                    <Add />
                  </IconButton>
                </Box>
              )}
            </Box>

            {section.items.length === 0 ? (
              <Typography variant="body2" color="text.secondary" sx={{ py: 1 }}>
                Nenhuma pergunta nesta seção.
                {!readOnly && " Use o botão + para adicionar."}
              </Typography>
            ) : (
              section.items.map((item) => (
                <Box
                  key={item.id}
                  display="flex"
                  justifyContent="space-between"
                  alignItems="center"
                  sx={{
                    py: 0.75,
                    borderTop: "1px solid",
                    borderColor: "divider",
                  }}
                >
                  <Box flex={1} minWidth={0}>
                    <Typography variant="body2">
                      {item.order}. {item.title}
                    </Typography>
                    {item.description && (
                      <Typography variant="caption" color="text.secondary" display="block">
                        {item.description}
                      </Typography>
                    )}
                    <Box display="flex" flexWrap="wrap" gap={0.5} mt={0.5}>
                      {item.requiresPhotoOnNonConformity && (
                        <Chip label="Requer Foto em Não Conformidade" size="small" variant="outlined" />
                      )}
                      {item.referenceImageUrl && (
                        <Chip label="Foto referência" size="small" variant="outlined" color="info" />
                      )}
                      {!item.active && <Chip label="Inativo" size="small" color="default" />}
                    </Box>
                  </Box>
                  {!readOnly && (
                    <Box>
                      <IconButton
                        size="small"
                        onClick={() => openEditItemDialog(section.id, item)}
                        aria-label="Editar pergunta"
                      >
                        <Edit />
                      </IconButton>
                      <IconButton
                        size="small"
                        color="error"
                        onClick={() => setDeletingItem({ sectionId: section.id, item })}
                        aria-label="Excluir pergunta"
                      >
                        <Delete />
                      </IconButton>
                    </Box>
                  )}
                </Box>
              ))
            )}
          </Paper>
        ))
      )}

      <Dialog
        open={metadataDialogOpen && !readOnly}
        onClose={() => setMetadataDialogOpen(false)}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle>Editar informações do checklist</DialogTitle>
        <DialogContent>
          <Box mt={2}>
            <ModuleSelect
              value={metadataModule}
              onChange={(value) => {
                setMetadataModule(value);
                if (value !== ModuleType.SEGURANCA_TRABALHO) {
                  setMetadataInspectionScope(InspectionScope.TEAM);
                }
              }}
            />
          </Box>
          {isWorkSafetyModule && (
            <Box mt={2}>
              <FormControl required>
                <FormLabel id="metadata-inspection-scope-label">Escopo atendido</FormLabel>
                <RadioGroup
                  row
                  aria-labelledby="metadata-inspection-scope-label"
                  value={metadataInspectionScope}
                  onChange={(event) => setMetadataInspectionScope(event.target.value as InspectionScope)}
                >
                  <FormControlLabel value={InspectionScope.TEAM} control={<Radio />} label="Equipe" />
                  <FormControlLabel value={InspectionScope.COLLABORATOR} control={<Radio />} label="Colaborador" />
                </RadioGroup>
              </FormControl>
            </Box>
          )}
          <Box mt={2}>
            <SectorSelect
              value={metadataSectorId}
              onChange={setMetadataSectorId}
              options={metadataSectorOptions}
              required
              disabled={isWorkSafetyModule && Boolean(workSafetySectorId)}
            />
          </Box>
          <TextField
            margin="normal"
            fullWidth
            label="Nome"
            value={metadataName}
            onChange={(e) => setMetadataName(e.target.value)}
          />
          <TextField
            margin="normal"
            fullWidth
            label="Descrição"
            value={metadataDescription}
            onChange={(e) => setMetadataDescription(e.target.value)}
          />
          <FormControlLabel
            control={<Switch checked={metadataActive} onChange={(e) => setMetadataActive(e.target.checked)} />}
            label="Ativo"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setMetadataDialogOpen(false)} disabled={savingMetadata}>Cancelar</Button>
          <Button
            variant="contained"
            disabled={!metadataName.trim() || !metadataModule || !metadataSectorId || savingMetadata}
            onClick={async () => {
              if (!checklist || !metadataModule || !metadataSectorId || savingMetadata) return;
              setSavingMetadata(true);
              try {
                const inspectionScope =
                  metadataModule === ModuleType.SEGURANCA_TRABALHO
                    ? metadataInspectionScope
                    : InspectionScope.TEAM;
                const updated = await appRepository.updateChecklist(checklist.id, {
                  module: metadataModule,
                  inspectionScope,
                  name: metadataName,
                  description: metadataDescription || undefined,
                  sectorId: metadataSectorId,
                  active: metadataActive,
                });
                setChecklist((current) =>
                  current
                    ? {
                        ...current,
                        ...updated,
                        sections: current.sections,
                      }
                    : current
                );
                setMetadataDialogOpen(false);
                void refreshReferenceChecklists();
              } catch (e) {
                setError(e instanceof Error ? e.message : "Não foi possível salvar as informações.");
              } finally {
                setSavingMetadata(false);
              }
            }}
          >
            Salvar
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={sectionDialogOpen && !readOnly} onClose={() => setSectionDialogOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle>{editingSectionId ? "Editar seção" : "Nova seção"}</DialogTitle>
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
          <Button onClick={() => setSectionDialogOpen(false)} disabled={savingSection}>Cancelar</Button>
          <Button
            variant="contained"
            disabled={!sectionName.trim() || savingSection}
            onClick={async () => {
              if (!checklist || savingSection) return;
              setSavingSection(true);
              try {
                const section = editingSectionId
                  ? await appRepository.updateChecklistSection(checklist.id, editingSectionId, {
                      name: sectionName,
                      order: sectionOrder,
                      active: sectionActive,
                    })
                  : await appRepository.createChecklistSection(checklist.id, {
                      name: sectionName,
                      order: sectionOrder,
                      active: sectionActive,
                    });
                upsertSectionInState(section);
                setSectionDialogOpen(false);
                setEditingSectionId(null);
              } catch (e) {
                setError(e instanceof Error ? e.message : "Não foi possível salvar a seção.");
              } finally {
                setSavingSection(false);
              }
            }}
          >
            Salvar
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={itemDialogOpen && !readOnly}
        onClose={() => {
          setItemDialogOpen(false);
          clearReferenceImageState();
        }}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle>{editingItemId ? "Editar pergunta" : "Nova pergunta"}</DialogTitle>
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
            <Button variant="outlined" component="label" startIcon={<AddAPhoto />} fullWidth>
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
                <Button size="small" color="inherit" sx={{ mt: 1 }} onClick={clearReferenceImageState}>
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
            disabled={!itemSectionId || !itemTitle.trim() || savingItem}
            onClick={async () => {
              if (!checklist || !itemSectionId || savingItem) return;
              setSavingItem(true);
              try {
                let savedItem: ChecklistItem;
                if (editingItemId) {
                  savedItem = await appRepository.updateChecklistItem(checklist.id, editingItemId, {
                    title: itemTitle,
                    description: itemDescription || undefined,
                    order: itemOrder,
                    requiresPhotoOnNonConformity: itemRequiresPhoto,
                    active: itemActive,
                  });
                  if (itemReferenceImageFile) {
                    savedItem = await appRepository.uploadChecklistItemReferenceImage(
                      checklist.id,
                      editingItemId,
                      itemReferenceImageFile
                    );
                  }
                } else {
                  savedItem = await appRepository.createChecklistItem(checklist.id, {
                    title: itemTitle,
                    description: itemDescription || undefined,
                    order: itemOrder,
                    sectionId: itemSectionId,
                    requiresPhotoOnNonConformity: itemRequiresPhoto,
                    active: itemActive,
                  });
                  if (itemReferenceImageFile) {
                    savedItem = await appRepository.uploadChecklistItemReferenceImage(
                      checklist.id,
                      savedItem.id,
                      itemReferenceImageFile
                    );
                  }
                }
                upsertItemInState(itemSectionId, savedItem);
                setItemDialogOpen(false);
                setEditingItemId(null);
                clearReferenceImageState();
              } catch (e) {
                setError(e instanceof Error ? e.message : "Não foi possível salvar a pergunta.");
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
        open={!!deletingSection && !readOnly}
        title="Excluir seção"
        description={`Deseja excluir a seção "${deletingSection?.title ?? deletingSection?.name ?? ""}"? As perguntas desta seção também serão removidas.`}
        confirmLabel="Excluir"
        loading={deletingSectionLoading}
        onClose={() => {
          if (deletingSectionLoading) return;
          setDeletingSection(null);
        }}
        onConfirm={async () => {
          if (!checklist || !deletingSection || deletingSectionLoading) return;
          setDeletingSectionLoading(true);
          try {
            await appRepository.deleteChecklistSection(checklist.id, deletingSection.id);
            removeSectionFromState(deletingSection.id);
            setDeletingSection(null);
          } catch (e) {
            setError(e instanceof Error ? e.message : "Não foi possível excluir a seção.");
            setDeletingSection(null);
          } finally {
            setDeletingSectionLoading(false);
          }
        }}
      />

      <ConfirmDialog
        open={!!deletingItem && !readOnly}
        title="Excluir pergunta"
        description={`Deseja excluir a pergunta "${deletingItem?.item.title ?? ""}"?`}
        confirmLabel="Excluir"
        loading={deletingItemLoading}
        onClose={() => {
          if (deletingItemLoading) return;
          setDeletingItem(null);
        }}
        onConfirm={async () => {
          if (!checklist || !deletingItem || deletingItemLoading) return;
          setDeletingItemLoading(true);
          try {
            await appRepository.deleteChecklistItem(checklist.id, deletingItem.item.id);
            removeItemFromState(deletingItem.sectionId, deletingItem.item.id);
            setDeletingItem(null);
          } catch (e) {
            setError(e instanceof Error ? e.message : "Não foi possível excluir a pergunta.");
            setDeletingItem(null);
          } finally {
            setDeletingItemLoading(false);
          }
        }}
      />
    </Box>
  );
};

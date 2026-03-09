import {
  Alert,
  Box,
  Button,
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
} from '@mui/material';
import {
  Add,
  Delete,
  Edit,
  Refresh,
  ExpandMore,
} from '@mui/icons-material';
import { useState, useEffect } from 'react';
import { Checklist, PaginatedResponse, Sector } from '@/domain';
import { ModuleSelect } from '@/components/ModuleSelect';
import { SectorSelect } from '@/components/SectorSelect';
import { ModuleType } from '@/domain/enums';
import { appRepository } from '@/repositories/AppRepository';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { ListPagination } from '@/components/ListPagination';

const DEFAULT_LIMIT = 10;

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
  const [selectedChecklist, setSelectedChecklist] = useState<Checklist | null>(null);
  const [selectedSectionId, setSelectedSectionId] = useState<string>("");
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [sectorTab, setSectorTab] = useState("all");
  const [checklistModule, setChecklistModule] = useState<ModuleType | ''>(ModuleType.CAMPO);
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

  const visibleChecklists = result?.data ?? [];
  const meta = result?.meta;

  if (loading && !result) {
    return (
      <Box display="flex" justifyContent="center" p={4}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4">Checklists</Typography>
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
      </Box>
      {error && (
        <Alert severity="warning" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <Paper sx={{ mb: 2 }}>
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
      </Paper>

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
            <ModuleSelect value={checklistModule} onChange={(value) => setChecklistModule(value)} />
          </Box>
          <Box mt={2}>
            <SectorSelect
              value={checklistSectorId}
              onChange={setChecklistSectorId}
              options={sectors}
              required
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
          <Button onClick={() => setChecklistDialogOpen(false)}>Cancelar</Button>
          <Button
            variant="contained"
            disabled={!checklistName.trim() || !checklistModule || !checklistSectorId}
            onClick={async () => {
              if (!checklistModule || !checklistSectorId) return;
              if (editingChecklist) {
                await appRepository.updateChecklist(editingChecklist.id, {
                  name: checklistName,
                  description: checklistDescription || undefined,
                  sectorId: checklistSectorId,
                  active: checklistActive,
                });
              } else {
                await appRepository.createChecklist({
                  module: checklistModule,
                  name: checklistName,
                  description: checklistDescription || undefined,
                  sectorId: checklistSectorId,
                  active: checklistActive,
                });
              }
              setChecklistDialogOpen(false);
              await load();
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

      <Dialog open={itemDialogOpen} onClose={() => setItemDialogOpen(false)} fullWidth maxWidth="sm">
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
          <FormControlLabel
            control={<Switch checked={itemActive} onChange={(e) => setItemActive(e.target.checked)} />}
            label="Ativo"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setItemDialogOpen(false)}>Cancelar</Button>
          <Button
            variant="contained"
            disabled={!selectedChecklist || !selectedSectionId || !itemTitle.trim()}
            onClick={async () => {
              if (!selectedChecklist || !selectedSectionId) return;
              if (editingItemId) {
                await appRepository.updateChecklistItem(selectedChecklist.id, editingItemId, {
                  title: itemTitle,
                  description: itemDescription || undefined,
                  order: itemOrder,
                  requiresPhotoOnNonConformity: itemRequiresPhoto,
                  active: itemActive,
                });
              } else {
                await appRepository.createChecklistItem(selectedChecklist.id, {
                  title: itemTitle,
                  description: itemDescription || undefined,
                  order: itemOrder,
                  sectionId: selectedSectionId,
                  requiresPhotoOnNonConformity: itemRequiresPhoto,
                  active: itemActive,
                });
              }
              setItemDialogOpen(false);
              setEditingItemId(null);
              await load();
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

import {
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
} from '@mui/material';
import {
  Add,
  Delete,
  Edit,
  Refresh,
  ExpandMore,
} from '@mui/icons-material';
import { useState, useEffect } from 'react';
import { Checklist } from '@/domain';
import { useReferenceStore } from '@/stores/referenceStore';
import { ModuleSelect } from '@/components/ModuleSelect';
import { ModuleType } from '@/domain/enums';
import { appRepository } from '@/repositories/AppRepository';

export const ChecklistsPage = (): JSX.Element => {
  const checklists = useReferenceStore((state) => state.checklists);
  const refreshFromApi = useReferenceStore((state) => state.refreshFromApi);
  const loadCache = useReferenceStore((state) => state.loadCache);
  const [loading, setLoading] = useState(true);
  const [checklistDialogOpen, setChecklistDialogOpen] = useState(false);
  const [sectionDialogOpen, setSectionDialogOpen] = useState(false);
  const [itemDialogOpen, setItemDialogOpen] = useState(false);
  const [editingChecklist, setEditingChecklist] = useState<Checklist | null>(null);
  const [selectedChecklist, setSelectedChecklist] = useState<Checklist | null>(null);
  const [selectedSectionId, setSelectedSectionId] = useState<string>("");
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [checklistModule, setChecklistModule] = useState<ModuleType | ''>(ModuleType.QUALIDADE);
  const [checklistName, setChecklistName] = useState("");
  const [checklistDescription, setChecklistDescription] = useState("");
  const [checklistActive, setChecklistActive] = useState(true);
  const [sectionName, setSectionName] = useState("");
  const [sectionOrder, setSectionOrder] = useState(1);
  const [sectionActive, setSectionActive] = useState(true);
  const [itemTitle, setItemTitle] = useState("");
  const [itemDescription, setItemDescription] = useState("");
  const [itemOrder, setItemOrder] = useState(1);
  const [itemRequiresPhoto, setItemRequiresPhoto] = useState(true);
  const [itemActive, setItemActive] = useState(true);

  useEffect(() => {
    const run = async () => {
      await loadCache();
      setLoading(false);
    };
    run();
  }, []);

  if (loading) {
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
            onClick={() => refreshFromApi()}
          >
            Atualizar catálogo
          </Button>
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={() => {
              setEditingChecklist(null);
              setChecklistModule(ModuleType.QUALIDADE);
              setChecklistName("");
              setChecklistDescription("");
              setChecklistActive(true);
              setChecklistDialogOpen(true);
            }}
          >
            Novo checklist
          </Button>
        </Box>
      </Box>

      {checklists.map((checklist: Checklist) => (
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
                      setChecklistActive(checklist.active);
                      setChecklistDialogOpen(true);
                    }}
                  >
                    <Edit />
                  </IconButton>
                  <IconButton
                    size="small"
                    color="error"
                    onClick={async (event) => {
                      event.stopPropagation();
                      if (!window.confirm("Deseja excluir o checklist?")) return;
                      await appRepository.deleteChecklist(checklist.id);
                      await refreshFromApi();
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
                              await refreshFromApi();
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

      <Dialog open={checklistDialogOpen} onClose={() => setChecklistDialogOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle>{editingChecklist ? "Editar checklist" : "Novo checklist"}</DialogTitle>
        <DialogContent>
          <Box mt={2}>
            <ModuleSelect value={checklistModule} onChange={(value) => setChecklistModule(value)} />
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
            disabled={!checklistName.trim() || !checklistModule}
            onClick={async () => {
              if (!checklistModule) return;
              if (editingChecklist) {
                await appRepository.updateChecklist(editingChecklist.id, {
                  name: checklistName,
                  description: checklistDescription || undefined,
                  active: checklistActive,
                });
              } else {
                await appRepository.createChecklist({
                  module: checklistModule,
                  name: checklistName,
                  description: checklistDescription || undefined,
                  active: checklistActive,
                });
              }
              setChecklistDialogOpen(false);
              await refreshFromApi();
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
              await refreshFromApi();
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
              await refreshFromApi();
            }}
          >
            Salvar
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

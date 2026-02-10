import {
  Box,
  Button,
  Paper,
  Typography,
  Tabs,
  Tab,
  List,
  ListItem,
  ListItemText,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Switch,
  FormControlLabel,
  CircularProgress,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Chip,
} from '@mui/material';
import {
  Add,
  Edit,
  Delete,
  ExpandMore,
  DragIndicator,
} from '@mui/icons-material';
import { useState, useEffect } from 'react';
import { Checklist, ChecklistItem, ModuleType } from '@/domain';
import { useRepository } from '@/app/RepositoryProvider';
import { useSnackbar } from '@/utils/useSnackbar';
import { ModuleSelect } from '@/components/ModuleSelect';

const moduleLabels: Record<ModuleType, string> = {
  [ModuleType.SEGURANCA_TRABALHO]: 'Segurança do Trabalho',
  [ModuleType.OBRAS_INVESTIMENTO]: 'Obras de Investimento',
  [ModuleType.OBRAS_GLOBAL]: 'Obras Globais',
  [ModuleType.CANTEIRO]: 'Canteiro',
};

export const ChecklistsPage = () => {
  const repository = useRepository();
  const { showSnackbar } = useSnackbar();
  const [checklists, setChecklists] = useState<Checklist[]>([]);
  const [checklistItems, setChecklistItems] = useState<ChecklistItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedModule, setSelectedModule] = useState<ModuleType>(
    ModuleType.SEGURANCA_TRABALHO
  );
  const [dialogOpen, setDialogOpen] = useState(false);
  const [itemDialogOpen, setItemDialogOpen] = useState(false);
  const [editingChecklist, setEditingChecklist] = useState<Checklist | null>(
    null
  );
  const [editingItem, setEditingItem] = useState<ChecklistItem | null>(null);
  const [selectedChecklist, setSelectedChecklist] = useState<string | null>(
    null
  );
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    module: ModuleType.SEGURANCA_TRABALHO,
    active: true,
  });
  const [itemFormData, setItemFormData] = useState({
    title: '',
    order: 1,
    requiresPhotoOnNonConformity: true,
  });

  useEffect(() => {
    loadChecklists();
  }, []);

  useEffect(() => {
    if (selectedChecklist) {
      loadChecklistItems(selectedChecklist);
    }
  }, [selectedChecklist]);

  const loadChecklists = async () => {
    try {
      setLoading(true);
      const data = await repository.getChecklists();
      setChecklists(data);
    } catch (error) {
      showSnackbar('Erro ao carregar checklists', 'error');
    } finally {
      setLoading(false);
    }
  };

  const loadChecklistItems = async (checklistId: string) => {
    try {
      const items = await repository.getChecklistItems(checklistId);
      setChecklistItems(items);
    } catch (error) {
      showSnackbar('Erro ao carregar itens', 'error');
    }
  };

  const handleOpenDialog = (checklist?: Checklist) => {
    if (checklist) {
      setEditingChecklist(checklist);
      setFormData({
        name: checklist.name,
        description: checklist.description || '',
        module: checklist.module,
        active: checklist.active,
      });
    } else {
      setEditingChecklist(null);
      setFormData({
        name: '',
        description: '',
        module: selectedModule,
        active: true,
      });
    }
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setEditingChecklist(null);
  };

  const handleSave = async () => {
    try {
      if (editingChecklist) {
        await repository.updateChecklist(editingChecklist.id, formData);
        showSnackbar('Checklist atualizado com sucesso', 'success');
      } else {
        await repository.createChecklist(formData);
        showSnackbar('Checklist criado com sucesso', 'success');
      }
      handleCloseDialog();
      loadChecklists();
    } catch (error) {
      showSnackbar('Erro ao salvar checklist', 'error');
    }
  };

  const handleOpenItemDialog = (item?: ChecklistItem) => {
    if (item) {
      setEditingItem(item);
      setItemFormData({
        title: item.title,
        order: item.order,
        requiresPhotoOnNonConformity: item.requiresPhotoOnNonConformity,
      });
    } else {
      setEditingItem(null);
      setItemFormData({
        title: '',
        order: checklistItems.length + 1,
        requiresPhotoOnNonConformity: true,
      });
    }
    setItemDialogOpen(true);
  };

  const handleCloseItemDialog = () => {
    setItemDialogOpen(false);
    setEditingItem(null);
  };

  const handleSaveItem = async () => {
    if (!selectedChecklist) return;
    try {
      if (editingItem) {
        await repository.updateChecklistItem(editingItem.id, itemFormData);
        showSnackbar('Item atualizado com sucesso', 'success');
      } else {
        await repository.createChecklistItem({
          ...itemFormData,
          checklistId: selectedChecklist,
        });
        showSnackbar('Item criado com sucesso', 'success');
      }
      handleCloseItemDialog();
      loadChecklistItems(selectedChecklist);
    } catch (error) {
      showSnackbar('Erro ao salvar item', 'error');
    }
  };

  const handleDeleteItem = async (id: string) => {
    if (window.confirm('Tem certeza que deseja excluir este item?')) {
      try {
        await repository.deleteChecklistItem(id);
        showSnackbar('Item excluído com sucesso', 'success');
        if (selectedChecklist) {
          loadChecklistItems(selectedChecklist);
        }
      } catch (error) {
        showSnackbar('Erro ao excluir item', 'error');
      }
    }
  };

  const filteredChecklists = checklists.filter(
    (c) => c.module === selectedModule
  );

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
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={() => handleOpenDialog()}
        >
          Novo Checklist
        </Button>
      </Box>

      <Paper sx={{ mb: 3 }}>
        <Tabs
          value={selectedModule}
          onChange={(_, newValue) => setSelectedModule(newValue)}
        >
          {Object.values(ModuleType).map((module) => (
            <Tab
              key={module}
              label={moduleLabels[module]}
              value={module}
            />
          ))}
        </Tabs>
      </Paper>

      <List>
        {filteredChecklists.map((checklist) => (
          <Accordion
            key={checklist.id}
            sx={{ mb: 1 }}
            onChange={(_, expanded) => {
              if (expanded) {
                setSelectedChecklist(checklist.id);
              }
            }}
          >
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
                <Typography variant="h6">{checklist.name}</Typography>
                <Box>
                  <Chip
                    label={checklist.active ? 'Ativo' : 'Inativo'}
                    size="small"
                    color={checklist.active ? 'success' : 'default'}
                    sx={{ mr: 1 }}
                  />
                  <IconButton
                    size="small"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleOpenDialog(checklist);
                    }}
                  >
                    <Edit />
                  </IconButton>
                </Box>
              </Box>
            </AccordionSummary>
            <AccordionDetails>
              <Box>
                <Box
                  display="flex"
                  justifyContent="space-between"
                  alignItems="center"
                  mb={2}
                >
                  <Typography variant="body2" color="text.secondary">
                    {checklist.description}
                  </Typography>
                  <Button
                    size="small"
                    startIcon={<Add />}
                    onClick={() => {
                      setSelectedChecklist(checklist.id);
                      handleOpenItemDialog();
                    }}
                  >
                    Adicionar Item
                  </Button>
                </Box>
                {selectedChecklist === checklist.id && (
                  <List>
                    {checklistItems.map((item) => (
                      <ListItem
                        key={item.id}
                        secondaryAction={
                          <Box>
                            <IconButton
                              size="small"
                              onClick={() => handleOpenItemDialog(item)}
                            >
                              <Edit />
                            </IconButton>
                            <IconButton
                              size="small"
                              color="error"
                              onClick={() => handleDeleteItem(item.id)}
                            >
                              <Delete />
                            </IconButton>
                          </Box>
                        }
                      >
                        <DragIndicator sx={{ mr: 1, color: 'text.secondary' }} />
                        <ListItemText
                          primary={item.title}
                          secondary={`Ordem: ${item.order} | Foto obrigatória: ${
                            item.requiresPhotoOnNonConformity ? 'Sim' : 'Não'
                          }`}
                        />
                      </ListItem>
                    ))}
                  </List>
                )}
              </Box>
            </AccordionDetails>
          </Accordion>
        ))}
      </List>

      <Dialog open={dialogOpen} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>
          {editingChecklist ? 'Editar Checklist' : 'Novo Checklist'}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2 }}>
            <ModuleSelect
              value={formData.module}
              onChange={(module) => setFormData({ ...formData, module })}
              disabled={!!editingChecklist}
            />
          </Box>
          <TextField
            fullWidth
            label="Nome"
            value={formData.name}
            onChange={(e) =>
              setFormData({ ...formData, name: e.target.value })
            }
            margin="normal"
            required
          />
          <TextField
            fullWidth
            label="Descrição"
            value={formData.description}
            onChange={(e) =>
              setFormData({ ...formData, description: e.target.value })
            }
            margin="normal"
            multiline
            rows={3}
          />
          <FormControlLabel
            control={
              <Switch
                checked={formData.active}
                onChange={(e) =>
                  setFormData({ ...formData, active: e.target.checked })
                }
              />
            }
            label="Ativo"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancelar</Button>
          <Button
            onClick={handleSave}
            variant="contained"
            disabled={!formData.name.trim()}
          >
            Salvar
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={itemDialogOpen}
        onClose={handleCloseItemDialog}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          {editingItem ? 'Editar Item' : 'Novo Item'}
        </DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            label="Título"
            value={itemFormData.title}
            onChange={(e) =>
              setItemFormData({ ...itemFormData, title: e.target.value })
            }
            margin="normal"
            required
          />
          <TextField
            fullWidth
            label="Ordem"
            type="number"
            value={itemFormData.order}
            onChange={(e) =>
              setItemFormData({
                ...itemFormData,
                order: parseInt(e.target.value) || 1,
              })
            }
            margin="normal"
          />
          <FormControlLabel
            control={
              <Switch
                checked={itemFormData.requiresPhotoOnNonConformity}
                onChange={(e) =>
                  setItemFormData({
                    ...itemFormData,
                    requiresPhotoOnNonConformity: e.target.checked,
                  })
                }
              />
            }
            label="Requer foto em não conformidade"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseItemDialog}>Cancelar</Button>
          <Button
            onClick={handleSaveItem}
            variant="contained"
            disabled={!itemFormData.title.trim()}
          >
            Salvar
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

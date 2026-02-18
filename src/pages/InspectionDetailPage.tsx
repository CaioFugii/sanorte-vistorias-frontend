import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Grid,
  LinearProgress,
  Paper,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableRow,
  Tabs,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material';
import { Edit, PictureAsPdf, ArrowBack, CheckCircle, Draw, PhotoLibrary, Event, Assignment } from '@mui/icons-material';
import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Inspection, InspectionItem } from '@/domain';
import { ChecklistAnswer, InspectionStatus } from '@/domain/enums';
import { appRepository } from '@/repositories/AppRepository';
import { StatusChip } from '@/components/StatusChip';
import { PercentBadge } from '@/components/PercentBadge';
import { PhotoFile, PhotoUploader } from '@/components/PhotoUploader';
import { getModuleLabel } from '@/utils/moduleLabel';
import jsPDF from 'jspdf';

function formatDateTime(iso: string | undefined): string {
  if (!iso) return '–';
  return new Date(iso).toLocaleString('pt-BR', {
    dateStyle: 'short',
    timeStyle: 'short',
  });
}

/** Itens não conformes que ainda precisam ser resolvidos. */
function getNonConformItems(items: InspectionItem[] | undefined): InspectionItem[] {
  if (!items) return [];
  return items.filter((i) => i.answer === ChecklistAnswer.NAO_CONFORME);
}

function getResolvedCount(items: InspectionItem[] | undefined): number {
  return getNonConformItems(items).filter((i) => i.resolvedAt != null).length;
}

function getItemTitle(item: InspectionItem): string {
  return item.checklistItem?.title ?? item.checklistItemId ?? 'Item';
}

export const InspectionDetailPage = (): JSX.Element => {
  const { externalId } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [inspection, setInspection] = useState<Inspection | null>(null);
  const [resolveModalOpen, setResolveModalOpen] = useState(false);
  const [resolveItem, setResolveItem] = useState<InspectionItem | null>(null);
  const [resolutionNotes, setResolutionNotes] = useState('');
  const [resolutionEvidence, setResolutionEvidence] = useState<PhotoFile[]>([]);
  const [resolving, setResolving] = useState(false);
  const [resolveError, setResolveError] = useState<string | null>(null);
  const [checklistTab, setChecklistTab] = useState(0);

  const loadInspection = async () => {
    if (!externalId) return;
    setLoading(true);
    const forceApi = true;
    const inspectionData = await appRepository.getInspection(externalId, forceApi);
    if (!inspectionData) {
      navigate('/inspections');
      return;
    }
    setInspection(inspectionData);
    setLoading(false);
  };

  useEffect(() => {
    if (externalId) {
      loadInspection();
    }
  }, [externalId]);

  const nonConformItems = inspection ? getNonConformItems(inspection.items) : [];
  const resolvedCount = inspection ? getResolvedCount(inspection.items) : 0;
  const allResolved = nonConformItems.length > 0 && resolvedCount === nonConformItems.length;
  const canResolveInspection = inspection?.status === InspectionStatus.PENDENTE_AJUSTE && allResolved;

  const openResolveModal = (item: InspectionItem) => {
    setResolveItem(item);
    setResolutionNotes('');
    setResolutionEvidence([]);
    setResolveError(null);
    setResolveModalOpen(true);
  };

  const closeResolveModal = () => {
    setResolveModalOpen(false);
    setResolveItem(null);
    setResolutionNotes('');
    setResolutionEvidence([]);
    setResolveError(null);
  };

  const getEvidenceBase64 = (): string | undefined => {
    const photo = resolutionEvidence[0];
    if (!photo?.dataUrl) return undefined;
    const base64 = photo.dataUrl.replace(/^data:[^;]+;base64,/, '');
    return base64 || undefined;
  };

  const handleResolveItem = async () => {
    if (!inspection || !resolveItem || !resolutionNotes.trim()) {
      setResolveError('Notas de resolução são obrigatórias.');
      return;
    }
    if (!inspection.serverId) {
      setResolveError('ID da vistoria não disponível. Atualize a página e tente novamente.');
      return;
    }
    setResolving(true);
    setResolveError(null);
    try {
      await appRepository.resolveInspectionItem(inspection.serverId, resolveItem.id, {
        resolutionNotes: resolutionNotes.trim(),
        resolutionEvidenceBase64: getEvidenceBase64(),
      });
      closeResolveModal();
      await loadInspection();
    } catch (e) {
      setResolveError(e instanceof Error ? e.message : 'Erro ao resolver item.');
    } finally {
      setResolving(false);
    }
  };

  const handleResolveInspection = async () => {
    if (!inspection || !canResolveInspection) return;
    setResolving(true);
    try {
      const resolved = await appRepository.resolvePendingInspection(inspection.externalId, {});
      setInspection(resolved);
    } finally {
      setResolving(false);
    }
  };

  const handleGeneratePDF = () => {
    if (!inspection) return;

    const doc = new jsPDF();
    doc.setFontSize(18);
    doc.text('Relatório de Vistoria', 20, 20);
    doc.setFontSize(12);
    doc.text(`Serviço: ${inspection.serviceDescription}`, 20, 30);
    if (inspection.locationDescription) {
      doc.text(`Localização: ${inspection.locationDescription}`, 20, 40);
    }
    doc.text(`Status: ${inspection.status}`, 20, 50);
    doc.text(`Percentual: ${inspection.scorePercent}%`, 20, 60);
    doc.text(
      `Data: ${inspection.finalizedAt || inspection.createdAt}`,
      20,
      70
    );

    doc.save(`vistoria-${inspection.externalId}.pdf`);
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" p={4}>
        <CircularProgress />
      </Box>
    );
  }

  if (!inspection) {
    return <Alert severity="warning">Vistoria não encontrada.</Alert>;
  }

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Box display="flex" alignItems="center" gap={2}>
          <Button
            startIcon={<ArrowBack />}
            onClick={() => navigate('/inspections')}
          >
            Voltar
          </Button>
          <Typography variant="h4">Detalhes da Vistoria</Typography>
        </Box>
        <Box display="flex" gap={2}>
          <Button
            variant="outlined"
            startIcon={<PictureAsPdf />}
            onClick={handleGeneratePDF}
          >
            Gerar PDF
          </Button>
          {inspection.status === InspectionStatus.RASCUNHO && (
            <Button
              variant="contained"
              startIcon={<Edit />}
              onClick={() => navigate(`/inspections/${inspection.externalId}/fill`)}
            >
              Editar
            </Button>
          )}
        </Box>
      </Box>

      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3, height: '100%' }}>
            <Typography variant="h6" gutterBottom display="flex" alignItems="center" gap={1}>
              <Assignment /> Informações gerais
            </Typography>
            <Typography variant="body2" gutterBottom>
              <strong>Serviço:</strong> {inspection.serviceDescription}
            </Typography>
            <Typography variant="body2" gutterBottom>
              <strong>Localização:</strong> {inspection.locationDescription || '–'}
            </Typography>
            <Typography variant="body2" gutterBottom>
              <strong>Status:</strong> <StatusChip status={inspection.status} />
            </Typography>
            <Typography variant="body2" gutterBottom>
              <strong>Percentual:</strong>{' '}
              {inspection.scorePercent !== undefined ? (
                <PercentBadge percent={inspection.scorePercent} />
              ) : (
                'N/A'
              )}
            </Typography>
            <Typography variant="body2" gutterBottom>
              <strong>Módulo:</strong> {getModuleLabel(inspection.module)}
            </Typography>
            {inspection.checklist && (
              <Typography variant="body2" gutterBottom>
                <strong>Checklist:</strong> {inspection.checklist.name}
              </Typography>
            )}
            {inspection.team && (
              <Typography variant="body2" gutterBottom>
                <strong>Equipe:</strong> {inspection.team.name}
              </Typography>
            )}
          </Paper>
        </Grid>
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3, height: '100%' }}>
            <Typography variant="h6" gutterBottom display="flex" alignItems="center" gap={1}>
              <Event /> Datas e responsáveis
            </Typography>
            <Typography variant="body2" gutterBottom>
              <strong>Criada em:</strong> {formatDateTime(inspection.createdAt)}
            </Typography>
            <Typography variant="body2" gutterBottom>
              <strong>Atualizada em:</strong> {formatDateTime(inspection.updatedAt)}
            </Typography>
            {inspection.finalizedAt && (
              <Typography variant="body2" gutterBottom>
                <strong>Finalizada em:</strong> {formatDateTime(inspection.finalizedAt)}
              </Typography>
            )}
            {inspection.createdBy && (
              <Typography variant="body2" gutterBottom>
                <strong>Criada por:</strong> {inspection.createdBy.name}
              </Typography>
            )}
            {inspection.collaborators && inspection.collaborators.length > 0 && (
              <Typography variant="body2" gutterBottom>
                <strong>Colaboradores:</strong>{' '}
                {inspection.collaborators.map((c) => c.name).join(', ')}
              </Typography>
            )}
          </Paper>
        </Grid>
      </Grid>

      {inspection.items && inspection.items.length > 0 && (() => {
        const conformes = inspection.items.filter((i) => i.answer === ChecklistAnswer.CONFORME);
        const naoConformes = inspection.items.filter((i) => i.answer === ChecklistAnswer.NAO_CONFORME);
        const naoAplicaveis = inspection.items.filter((i) => i.answer === ChecklistAnswer.NAO_APLICAVEL);
        const tabPanels = [
          { label: 'Conforme', count: conformes.length, items: conformes },
          { label: 'Não conforme', count: naoConformes.length, items: naoConformes },
          { label: 'Não aplicável', count: naoAplicaveis.length, items: naoAplicaveis },
        ];
        const currentPanel = tabPanels[checklistTab];
        return (
          <Paper sx={{ p: 3, mt: 3 }}>
            <Typography variant="h6" gutterBottom display="flex" alignItems="center" gap={1}>
              <Assignment /> Resumo do checklist
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Total: {inspection.items.length} itens
            </Typography>
            <Tabs
              value={checklistTab}
              onChange={(_, v) => setChecklistTab(v)}
              sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}
            >
              <Tab label={`Conforme (${conformes.length})`} id="checklist-tab-0" aria-controls="checklist-panel-0" />
              <Tab label={`Não conforme (${naoConformes.length})`} id="checklist-tab-1" aria-controls="checklist-panel-1" />
              <Tab label={`Não aplicável (${naoAplicaveis.length})`} id="checklist-tab-2" aria-controls="checklist-panel-2" />
            </Tabs>
            <Box role="tabpanel" id={`checklist-panel-${checklistTab}`} aria-labelledby={`checklist-tab-${checklistTab}`}>
              {currentPanel.items.length === 0 ? (
                <Typography variant="body2" color="text.secondary">
                  Nenhum item nesta categoria.
                </Typography>
              ) : (
                <Box sx={{ maxHeight: 400, overflowY: 'auto' }}>
                  <Table size="small">
                    <TableBody>
                    {currentPanel.items.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell sx={{ verticalAlign: 'top' }}>
                          <Typography variant="body2">{getItemTitle(item)}</Typography>
                          {item.notes && (
                            <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 0.5 }}>
                              {item.notes}
                            </Typography>
                          )}
                          {checklistTab === 1 && item.resolvedAt != null && (
                            <Box sx={{ mt: 1 }}>
                              {item.resolutionNotes && (
                                <Typography variant="caption" color="success.dark" display="block" sx={{ mt: 0.5 }}>
                                  <strong>Resolução:</strong> {item.resolutionNotes}
                                </Typography>
                              )}
                              <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 0.25 }}>
                                Resolvido em {new Date(item.resolvedAt).toLocaleString('pt-BR')}
                                {item.resolvedBy?.name && ` por ${item.resolvedBy.name}`}
                              </Typography>
                            </Box>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                </Box>
              )}
            </Box>
          </Paper>
        );
      })()}

      {inspection.signatures && inspection.signatures.length > 0 && (
        <Paper sx={{ p: 3, mt: 3 }}>
          <Typography variant="h6" gutterBottom display="flex" alignItems="center" gap={1}>
            <Draw /> Assinatura
          </Typography>
          {inspection.signatures.map((sig) => (
            <Box key={sig.id} sx={{ display: 'flex', alignItems: 'flex-start', gap: 2, flexWrap: 'wrap' }}>
              {(sig.url || sig.dataUrl) && (
                <Box
                  component="img"
                  src={sig.url ?? sig.dataUrl ?? ''}
                  alt={`Assinatura de ${sig.signerName}`}
                  sx={{ maxHeight: 80, border: 1, borderColor: 'divider', borderRadius: 1 }}
                />
              )}
              <Box>
                <Typography variant="body2">
                  <strong>{sig.signerName}</strong>
                  {sig.signerRoleLabel && ` · ${sig.signerRoleLabel}`}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Assinado em {formatDateTime(sig.signedAt)}
                </Typography>
              </Box>
            </Box>
          ))}
        </Paper>
      )}

      {inspection.evidences && inspection.evidences.length > 0 && (
        <Paper sx={{ p: 3, mt: 3, maxWidth: 480 }}>
          <Typography variant="h6" gutterBottom display="flex" alignItems="center" gap={1}>
            <PhotoLibrary /> Evidências
          </Typography>
          <Box
            component="ul"
            sx={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: 1.5,
              listStyle: 'none',
              m: 0,
              p: 0,
              maxHeight: 320,
              overflowY: 'auto',
            }}
          >
            {inspection.evidences.map((ev) => {
              const src = ev.url ?? ev.dataUrl ?? '';
              const thumbSize = 56;
              return (
                <Box
                  component="li"
                  key={ev.id}
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1,
                    minWidth: 0,
                    flex: '1 1 auto',
                    maxWidth: 220,
                  }}
                >
                  {src ? (
                    <Box
                      component="a"
                      href={src}
                      target="_blank"
                      rel="noopener noreferrer"
                      sx={{
                        flexShrink: 0,
                        width: thumbSize,
                        height: thumbSize,
                        borderRadius: 1,
                        overflow: 'hidden',
                        bgcolor: 'action.hover',
                        display: 'block',
                      }}
                    >
                      <img
                        src={src}
                        alt=""
                        loading="lazy"
                        style={{
                          width: '100%',
                          height: '100%',
                          objectFit: 'cover',
                          display: 'block',
                        }}
                      />
                    </Box>
                  ) : (
                    <Box
                      sx={{
                        width: thumbSize,
                        height: thumbSize,
                        borderRadius: 1,
                        bgcolor: 'action.hover',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                      }}
                    >
                      <PhotoLibrary fontSize="small" color="action" />
                    </Box>
                  )}
                  <Typography
                    variant="body2"
                    noWrap
                    sx={{ minWidth: 0, flex: 1 }}
                    title={ev.fileName}
                  >
                    {ev.fileName}
                  </Typography>
                  {src && (
                    <Button
                      size="small"
                      href={src}
                      target="_blank"
                      rel="noopener noreferrer"
                      sx={{ flexShrink: 0 }}
                    >
                      Ver
                    </Button>
                  )}
                </Box>
              );
            })}
          </Box>
        </Paper>
      )}

      {inspection.status === InspectionStatus.PENDENTE_AJUSTE && nonConformItems.length > 0 && (
        <Paper sx={{ p: 3, mt: 3 }}>
          <Typography variant="h6" gutterBottom>
            Itens não conformes
          </Typography>
          <Typography variant="body2" color="text.secondary" gutterBottom>
            {resolvedCount} de {nonConformItems.length} itens resolvidos
          </Typography>
          <LinearProgress
            variant="determinate"
            value={nonConformItems.length ? (resolvedCount / nonConformItems.length) * 100 : 0}
            sx={{ mb: 2, height: 8, borderRadius: 1 }}
          />
          <Box component="ul" sx={{ m: 0, pl: 2.5, maxHeight: 400, overflowY: 'auto' }}>
            {nonConformItems.map((item) => {
              const isResolved = item.resolvedAt != null;
              return (
                <Box
                  component="li"
                  key={item.id}
                  sx={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    justifyContent: 'space-between',
                    gap: 2,
                    py: 1,
                    borderBottom: '1px solid',
                    borderColor: 'divider',
                  }}
                >
                  <Box flex={1}>
                    <Typography variant="subtitle2">{getItemTitle(item)}</Typography>
                    {item.notes && (
                      <Typography variant="body2" color="text.secondary">
                        Notas: {item.notes}
                      </Typography>
                    )}
                    {isResolved && (
                      <Box sx={{ mt: 1 }}>
                        <Typography variant="caption" color="success.main" display="flex" alignItems="center" gap={0.5}>
                          <CheckCircle fontSize="small" /> Resolvido
                          {item.resolvedAt &&
                            ` em ${new Date(item.resolvedAt).toLocaleDateString('pt-BR')}`}
                          {item.resolvedBy?.name && ` por ${item.resolvedBy.name}`}
                        </Typography>
                        {item.resolutionNotes && (
                          <Typography variant="body2" sx={{ mt: 0.5 }}>
                            {item.resolutionNotes}
                          </Typography>
                        )}
                        {item.resolutionEvidencePath && (
                          <Button
                            size="small"
                            href={item.resolutionEvidencePath}
                            target="_blank"
                            rel="noopener noreferrer"
                            sx={{ mt: 0.5 }}
                          >
                            Ver evidência
                          </Button>
                        )}
                      </Box>
                    )}
                  </Box>
                  {!isResolved && (
                    <Button
                      size="small"
                      variant="contained"
                      color="warning"
                      onClick={() => openResolveModal(item)}
                    >
                      Resolver este item
                    </Button>
                  )}
                </Box>
              );
            })}
          </Box>
          {canResolveInspection && (
            <Box sx={{ mt: 2 }}>
              <Tooltip
                title={
                  allResolved
                    ? 'Marcar vistoria como resolvida (opcional; já está resolvida ao resolver o último item).'
                    : 'Resolva todos os itens não conformes antes.'
                }
              >
                <span>
                  <Button
                    variant="outlined"
                    color="success"
                    onClick={handleResolveInspection}
                    disabled={resolving}
                  >
                    Resolver vistoria
                  </Button>
                </span>
              </Tooltip>
            </Box>
          )}
          {!allResolved && nonConformItems.length > 0 && (
            <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 1 }}>
              Resolva todos os itens acima para que a vistoria possa ser marcada como resolvida.
            </Typography>
          )}
        </Paper>
      )}

      {inspection.status === InspectionStatus.PENDENTE_AJUSTE && (!inspection.items || nonConformItems.length === 0) && (
        <Alert severity="info" sx={{ mt: 2 }}>
          Nenhum item não conforme a exibir. Se a vistoria ainda estiver pendente, atualize a página para carregar os itens.
        </Alert>
      )}

      <Dialog open={resolveModalOpen} onClose={closeResolveModal} maxWidth="sm" fullWidth>
        <DialogTitle>Resolver item não conforme</DialogTitle>
        <DialogContent>
          {resolveItem && (
            <Box>
              <Typography variant="subtitle2" gutterBottom>
                {getItemTitle(resolveItem)}
              </Typography>
              <TextField
                fullWidth
                label="Notas de resolução"
                multiline
                rows={4}
                value={resolutionNotes}
                onChange={(e) => setResolutionNotes(e.target.value)}
                margin="normal"
                required
                error={!!resolveError}
                helperText={resolveError}
              />
              <Box sx={{ mt: 2 }}>
                <Typography variant="subtitle2" gutterBottom>
                  Evidência de correção (opcional)
                </Typography>
                <PhotoUploader
                  photos={resolutionEvidence}
                  onChange={setResolutionEvidence}
                  maxPhotos={1}
                />
              </Box>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={closeResolveModal}>Cancelar</Button>
          <Button
            onClick={handleResolveItem}
            variant="contained"
            color="success"
            disabled={resolving || !resolutionNotes.trim()}
          >
            {resolving ? 'Salvando…' : 'Resolver item'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

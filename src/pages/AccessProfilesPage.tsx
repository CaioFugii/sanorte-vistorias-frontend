import {
  Box,
  Button,
  Checkbox,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControlLabel,
  FormGroup,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from "@mui/material";
import { Add, ContentCopy } from "@mui/icons-material";
import { useEffect, useState } from "react";
import { ACCESS_ACTION_TAB, AccessAction, AccessTab } from "@/domain/enums";
import {
  ACCESS_ACTION_LABELS,
  ACCESS_CATALOG,
  ACCESS_TAB_LABELS,
  actionsOfTab,
} from "@/domain/rules/access-area";
import type { AccessProfile, PaginatedResponse } from "@/domain/types";
import { appRepository } from "@/repositories/AppRepository";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { ListPagination } from "@/components/ListPagination";
import {
  PageHeader,
  SectionTable,
  TableActionsCell,
  TableActionsGroup,
  TableActionsHeaderCell,
  TableDeleteButton,
  TableEditButton,
} from "@/components/ui";

const DEFAULT_LIMIT = 10;

function errorText(error: unknown, fallback: string): string {
  const message = (error as { response?: { data?: { message?: string | string[] } } })?.response
    ?.data?.message;
  if (Array.isArray(message)) return message.join(" ");
  return message || fallback;
}

export const AccessProfilesPage = (): JSX.Element => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(DEFAULT_LIMIT);
  const [result, setResult] = useState<PaginatedResponse<AccessProfile> | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<AccessProfile | null>(null);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [areas, setAreas] = useState<AccessTab[]>([]);
  const [actions, setActions] = useState<AccessAction[]>([]);
  const [formError, setFormError] = useState<string | null>(null);
  const [duplicateOf, setDuplicateOf] = useState<AccessProfile | null>(null);
  const [duplicateName, setDuplicateName] = useState("");
  const [deleting, setDeleting] = useState<AccessProfile | null>(null);
  const [deletingBusy, setDeletingBusy] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  const load = async (nextPage = page, nextLimit = limit) => {
    setLoading(true);
    try {
      setResult(await appRepository.getAccessProfiles({ page: nextPage, limit: nextLimit }));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load(page, limit);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, limit]);

  const openCreate = () => {
    setEditing(null);
    setName("");
    setDescription("");
    setAreas([]);
    setActions([]);
    setFormError(null);
    setDialogOpen(true);
  };

  const openEdit = (profile: AccessProfile) => {
    setEditing(profile);
    setName(profile.name);
    setDescription(profile.description ?? "");
    setAreas(profile.areas);
    setActions(profile.actions ?? []);
    setFormError(null);
    setDialogOpen(true);
  };

  const toggleTab = (tab: AccessTab) => {
    if (areas.includes(tab)) {
      setAreas((current) => current.filter((item) => item !== tab));
      setActions((current) => current.filter((action) => ACCESS_ACTION_TAB[action] !== tab));
      return;
    }
    setAreas((current) => [...current, tab]);
  };

  const toggleAction = (action: AccessAction) => {
    setActions((current) =>
      current.includes(action) ? current.filter((item) => item !== action) : [...current, action]
    );
  };

  const renderTab = (tab: AccessTab, label = ACCESS_TAB_LABELS[tab]) => {
    const tabActions = actionsOfTab(tab);
    const tabChecked = areas.includes(tab);
    return (
      <Box key={tab} display="flex" alignItems="center" flexWrap="wrap" columnGap={1}>
        <FormControlLabel
          sx={{ minWidth: 200 }}
          control={<Checkbox checked={tabChecked} onChange={() => toggleTab(tab)} />}
          label={label}
        />
        {tabActions.map((action) => (
          <FormControlLabel
            key={action}
            disabled={!tabChecked}
            control={
              <Checkbox
                size="small"
                checked={tabChecked && actions.includes(action)}
                onChange={() => toggleAction(action)}
              />
            }
            label={<Typography variant="body2">{ACCESS_ACTION_LABELS[action]}</Typography>}
          />
        ))}
      </Box>
    );
  };

  const save = async () => {
    setSaving(true);
    setFormError(null);
    try {
      const input = {
        name: name.trim(),
        description: description.trim(),
        areas,
        actions: actions.filter((action) => areas.includes(ACCESS_ACTION_TAB[action])),
      };
      if (editing) {
        await appRepository.updateAccessProfile(editing.id, input);
      } else {
        await appRepository.createAccessProfile(input);
      }
      setDialogOpen(false);
      await load();
    } catch (error) {
      setFormError(errorText(error, "Não foi possível salvar o Acesso."));
    } finally {
      setSaving(false);
    }
  };

  const rows = result?.data ?? [];

  return (
    <Box>
      <PageHeader
        eyebrow="Administração"
        title="Acessos"
        subtitle="Defina o que cada pessoa pode ver."
        actions={
          <Button variant="contained" startIcon={<Add />} onClick={openCreate}>
            Novo acesso
          </Button>
        }
      />
      {actionError && (
        <Typography color="error" sx={{ mb: 2 }}>
          {actionError}
        </Typography>
      )}
      <SectionTable title="Lista de acessos">
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Nome</TableCell>
              <TableCell>Descrição</TableCell>
              <TableCell>Abas</TableCell>
              <TableCell>Pessoas</TableCell>
              <TableActionsHeaderCell />
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={5} align="center" sx={{ py: 4 }}>
                  <CircularProgress size={28} />
                </TableCell>
              </TableRow>
            ) : rows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} align="center" sx={{ py: 4 }}>
                  Nenhum Acesso cadastrado.
                </TableCell>
              </TableRow>
            ) : (
              rows.map((profile) => (
                <TableRow key={profile.id}>
                  <TableCell>{profile.name}</TableCell>
                  <TableCell>{profile.description || "—"}</TableCell>
                  <TableCell>{profile.areas.length}</TableCell>
                  <TableCell>{profile.userCount}</TableCell>
                  <TableActionsCell>
                    <TableActionsGroup>
                      <TableEditButton onClick={() => openEdit(profile)} />
                      <Button
                        size="small"
                        startIcon={<ContentCopy />}
                        onClick={() => {
                          setDuplicateOf(profile);
                          setDuplicateName(`${profile.name} cópia`);
                          setActionError(null);
                        }}
                      >
                        Duplicar
                      </Button>
                      <TableDeleteButton
                        onClick={() => {
                          setDeleting(profile);
                          setActionError(null);
                        }}
                      />
                    </TableActionsGroup>
                  </TableActionsCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
        {result?.meta && result.meta.total > 0 && (
          <ListPagination
            meta={result.meta}
            onPageChange={setPage}
            onRowsPerPageChange={(next) => {
              setLimit(next);
              setPage(1);
            }}
            rowsPerPageOptions={[10, 20, 50]}
            disabled={loading}
          />
        )}
      </SectionTable>

      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} fullWidth maxWidth="md">
        <DialogTitle>{editing ? "Editar acesso" : "Novo acesso"}</DialogTitle>
        <DialogContent>
          {editing && (
            <Typography variant="body2" sx={{ mt: 1 }}>
              {editing.userCount} pessoa(s) usam este Acesso.
            </Typography>
          )}
          <TextField
            margin="normal"
            fullWidth
            label="Nome"
            value={name}
            onChange={(event) => setName(event.target.value)}
          />
          <TextField
            margin="normal"
            fullWidth
            label="Descrição"
            value={description}
            onChange={(event) => setDescription(event.target.value)}
          />
          {ACCESS_CATALOG.map((group) => (
            <Box key={group.label} sx={{ mt: 2 }}>
              <Typography variant="subtitle2">{group.label}</Typography>
              {group.screens.map((screen) =>
                screen.tabs.length === 1 ? (
                  <FormGroup key={screen.label}>{renderTab(screen.tabs[0], screen.label)}</FormGroup>
                ) : (
                  <Box key={screen.label} sx={{ mt: 0.5 }}>
                    <Typography variant="body2" color="text.secondary">
                      {screen.label}
                    </Typography>
                    <FormGroup sx={{ pl: 2 }}>{screen.tabs.map((tab) => renderTab(tab))}</FormGroup>
                  </Box>
                )
              )}
            </Box>
          ))}
          {formError && (
            <Typography color="error" variant="body2">
              {formError}
            </Typography>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>Cancelar</Button>
          <Button
            variant="contained"
            disabled={saving || !name.trim() || areas.length === 0}
            onClick={() => void save()}
          >
            Salvar
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={!!duplicateOf} onClose={() => setDuplicateOf(null)} fullWidth maxWidth="xs">
        <DialogTitle>Duplicar acesso</DialogTitle>
        <DialogContent>
          <TextField
            margin="normal"
            fullWidth
            label="Nome"
            value={duplicateName}
            onChange={(event) => setDuplicateName(event.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDuplicateOf(null)}>Cancelar</Button>
          <Button
            variant="contained"
            disabled={!duplicateName.trim() || saving}
            onClick={async () => {
              if (!duplicateOf) return;
              setSaving(true);
              setActionError(null);
              try {
                await appRepository.duplicateAccessProfile(duplicateOf.id, duplicateName.trim());
                setDuplicateOf(null);
                await load();
              } catch (error) {
                setActionError(errorText(error, "Não foi possível duplicar o Acesso."));
              } finally {
                setSaving(false);
              }
            }}
          >
            Duplicar
          </Button>
        </DialogActions>
      </Dialog>

      <ConfirmDialog
        open={!!deleting}
        title="Excluir acesso"
        description={
          deleting?.isSystem
            ? "Este Acesso de partida não pode ser excluído."
            : deleting && deleting.userCount > 0
              ? `Não é possível excluir um Acesso usado por ${deleting.userCount} pessoa(s).`
              : `Deseja excluir o Acesso "${deleting?.name ?? ""}"?`
        }
        confirmLabel="Excluir"
        loading={deletingBusy}
        onClose={() => {
          if (!deletingBusy) setDeleting(null);
        }}
        onConfirm={async () => {
          if (!deleting || deleting.isSystem || deleting.userCount > 0) {
            setDeleting(null);
            return;
          }
          setDeletingBusy(true);
          try {
            await appRepository.deleteAccessProfile(deleting.id);
            setDeleting(null);
            await load();
          } catch (error) {
            setActionError(errorText(error, "Não foi possível excluir o Acesso."));
            setDeleting(null);
          } finally {
            setDeletingBusy(false);
          }
        }}
      />
    </Box>
  );
};

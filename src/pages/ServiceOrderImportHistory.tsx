import {
  Alert,
  Box,
  Button,
  CircularProgress,
  TextField,
  Typography,
} from "@mui/material";
import { useEffect, useState } from "react";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { ListPagination } from "@/components/ListPagination";
import { SectionTable } from "@/components/ui";
import {
  PaginatedResponse,
  ServiceOrderImportDetail,
  ServiceOrderImportLine,
  ServiceOrderImportLineStatus,
  ServiceOrderImportSummary,
} from "@/domain";
import { editableImportFieldKeys, visibleImportFields } from "@/domain/rules/serviceOrderImportFields";
import { appRepository } from "@/repositories/AppRepository";
import { downloadBlob } from "@/utils/downloadBlob";

const DEFAULT_LIMIT = 10;

function errorText(error: unknown, fallback: string): string {
  if (error && typeof error === "object" && "response" in error) {
    const message = (error as { response?: { data?: { message?: string | string[] } } }).response?.data?.message;
    if (Array.isArray(message)) return message.join(" ");
    if (typeof message === "string" && message.trim()) return message;
  }
  if (error instanceof Error && error.message) return error.message;
  return fallback;
}

function insertedDeletionText(orderCount: number, inspectionCount: number): string {
  const orders =
    orderCount === 1 ? "1 ordem de serviço inserida" : `${orderCount} ordens de serviço inseridas`;
  const inspections = inspectionCount === 1 ? "1 vistoria" : `${inspectionCount} vistorias`;
  const verb = orderCount === 1 ? "Será excluída" : "Serão excluídas";
  return `${verb} ${orders} por este arquivo e ${inspections}. Esta ação não pode ser desfeita.`;
}

function formatWhen(value?: string | null): string {
  if (!value) return "—";
  return new Date(value).toLocaleString("pt-BR");
}

function ImportLineEditor({
  importId,
  line,
  readOnly,
  onResolved,
}: {
  importId: string;
  line: ServiceOrderImportLine;
  readOnly: boolean;
  onResolved: () => void;
}): JSX.Element {
  const [baseRow, setBaseRow] = useState<Record<string, string>>(line.rawRow ?? {});
  const [fields, setFields] = useState(() => visibleImportFields(line.rawRow ?? {}));
  const [reason, setReason] = useState(line.reason);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const confirm = async () => {
    setSaving(true);
    setError(null);
    const row = { ...baseRow };
    for (const field of fields) row[field.key] = field.value;
    try {
      const updated = await appRepository.reprocessServiceOrderImportLine(importId, line.id, row);
      if (updated.status === ServiceOrderImportLineStatus.ENTERED) {
        onResolved();
        return;
      }
      const nextRow = updated.rawRow ?? row;
      setReason(updated.reason);
      setBaseRow(nextRow);
      setFields(visibleImportFields(nextRow));
    } catch (err) {
      setError(errorText(err, "Não foi possível reprocessar a linha."));
    } finally {
      setSaving(false);
    }
  };

  const editableKeys = editableImportFieldKeys(reason, baseRow);
  const fieldIsEditable = (key: string) =>
    !readOnly && (editableKeys === null || editableKeys.has(key));

  return (
    <Box sx={{ border: "1px solid", borderColor: "divider", borderRadius: 1, p: 2, mb: 2 }}>
      <Typography variant="subtitle2">Linha {line.lineNumber}</Typography>
      {reason && (
        <Typography color="error" variant="body2" sx={{ mt: 0.5, mb: 1 }}>
          {reason}
        </Typography>
      )}
      <Box display="grid" gridTemplateColumns={{ xs: "1fr", md: "1fr 1fr" }} gap={1.5}>
        {fields.map((field) => {
          const editable = fieldIsEditable(field.key);
          return (
            <TextField
              key={field.key}
              size="small"
              label={field.key}
              value={field.value}
              disabled={!editable}
              onChange={
                editable
                  ? (event) =>
                      setFields((current) =>
                        current.map((item) =>
                          item.key === field.key ? { ...item, value: event.target.value } : item,
                        ),
                      )
                  : undefined
              }
            />
          );
        })}
      </Box>
      {error && (
        <Alert severity="error" sx={{ mt: 1 }}>
          {error}
        </Alert>
      )}
      {!readOnly && (
        <Button variant="contained" sx={{ mt: 1.5 }} onClick={confirm} disabled={saving || !navigator.onLine}>
          {saving ? "Salvando..." : "Confirmar correção"}
        </Button>
      )}
    </Box>
  );
}

export function ServiceOrderImportHistory({
  refreshKey,
  canDelete,
  canEdit,
}: {
  refreshKey: number;
  canDelete: boolean;
  canEdit: boolean;
}): JSX.Element {
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(DEFAULT_LIMIT);
  const [result, setResult] = useState<PaginatedResponse<ServiceOrderImportSummary> | null>(null);
  const [loading, setLoading] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [detail, setDetail] = useState<ServiceOrderImportDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [localRefresh, setLocalRefresh] = useState(0);
  const [previewingId, setPreviewingId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [pendingDelete, setPendingDelete] = useState<{
    id: string;
    serviceOrderCount: number;
    inspectionCount: number;
  } | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    appRepository
      .getServiceOrderImports({ page, limit })
      .then((response) => {
        if (!cancelled) setResult(response);
      })
      .catch((err) => {
        if (!cancelled) setError(errorText(err, "Não foi possível carregar o histórico."));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [page, limit, refreshKey, localRefresh]);

  const openDetail = (importId: string) => {
    setSelectedId(importId);
    setDetail(null);
    setDetailLoading(true);
    appRepository
      .getServiceOrderImport(importId)
      .then(setDetail)
      .catch((err) => setError(errorText(err, "Não foi possível abrir o lançamento.")))
      .finally(() => setDetailLoading(false));
  };

  const askDelete = async (item: ServiceOrderImportSummary) => {
    setNotice(null);
    setError(null);
    setPreviewingId(item.id);
    try {
      const preview = await appRepository.previewServiceOrderImportDeletion(item.id);
      if (preview.serviceOrderCount === 0) {
        setNotice("Este arquivo não tem ordens de serviço inseridas para excluir.");
        return;
      }
      setPendingDelete({
        id: item.id,
        serviceOrderCount: preview.serviceOrderCount,
        inspectionCount: preview.inspectionCount,
      });
    } catch (err) {
      setError(errorText(err, "Não foi possível preparar a exclusão."));
    } finally {
      setPreviewingId(null);
    }
  };

  const confirmDelete = async () => {
    if (!pendingDelete) return;
    setDeleting(true);
    setError(null);
    try {
      await appRepository.deleteServiceOrderImportInserted(pendingDelete.id);
      setPendingDelete(null);
      setNotice(null);
      setLocalRefresh((current) => current + 1);
    } catch (err) {
      setError(errorText(err, "Não foi possível excluir as ordens inseridas por este arquivo."));
    } finally {
      setDeleting(false);
    }
  };

  const download = async (importId: string) => {
    try {
      const file = await appRepository.downloadServiceOrderImport(importId);
      downloadBlob(file.blob, file.filename);
    } catch (err) {
      setError(errorText(err, "Não foi possível baixar o arquivo."));
    }
  };

  const pending = (detail?.lines ?? []).filter(
    (line) => line.status === ServiceOrderImportLineStatus.NOT_REGISTERED
  );
  const entered = (detail?.lines ?? []).filter(
    (line) => line.status === ServiceOrderImportLineStatus.ENTERED
  );

  return (
    <Box sx={{ mt: 3 }}>
      <Typography variant="h6" sx={{ mb: 1 }}>
        Histórico de importação
      </Typography>
      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}
      {notice && (
        <Alert severity="info" sx={{ mb: 2 }} onClose={() => setNotice(null)}>
          {notice}
        </Alert>
      )}
      <SectionTable title="Lançamentos">
        <Box sx={{ overflowX: "auto" }}>
          <Box component="table" sx={{ width: "100%", borderCollapse: "collapse", "& td, & th": { textAlign: "left", p: 1, borderBottom: "1px solid", borderColor: "divider" } }}>
            <thead>
              <tr>
                <th>Data</th>
                <th>Usuário</th>
                <th>Contrato</th>
                <th>Arquivo</th>
                <th>Inseridas</th>
                <th>Ignoradas</th>
                <th>Deletadas</th>
                <th>Não registradas</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={9}>
                    <Box display="flex" justifyContent="center" py={2}>
                      <CircularProgress size={28} />
                    </Box>
                  </td>
                </tr>
              ) : (result?.data.length ?? 0) === 0 ? (
                <tr>
                  <td colSpan={9}>Nenhum lançamento registrado.</td>
                </tr>
              ) : (
                result?.data.map((item) => (
                  <tr key={item.id}>
                    <td>{formatWhen(item.createdAt)}</td>
                    <td>{item.user?.name || "—"}</td>
                    <td>{item.contract?.name || "—"}</td>
                    <td>{item.originalFileName}</td>
                    <td>{item.insertedCount}</td>
                    <td>{item.skippedCount}</td>
                    <td>{item.deletedCount}</td>
                    <td>{item.notRegisteredCount}</td>
                    <td>
                      <Button size="small" onClick={() => openDetail(item.id)}>
                        Abrir
                      </Button>
                      <Button size="small" onClick={() => download(item.id)}>
                        Baixar
                      </Button>
                      {canDelete && (
                        <Button
                          size="small"
                          color="error"
                          onClick={() => askDelete(item)}
                          disabled={previewingId === item.id || deleting || !navigator.onLine}
                        >
                          Excluir
                        </Button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </Box>
        </Box>
        {result?.meta && (
          <ListPagination
            meta={result.meta}
            onPageChange={setPage}
            onRowsPerPageChange={(newLimit) => {
              setLimit(newLimit);
              setPage(1);
            }}
            rowsPerPageOptions={[10, 20, 50]}
            disabled={loading}
          />
        )}
      </SectionTable>

      {selectedId && (
        <Box sx={{ mt: 2 }}>
          {detailLoading || !detail ? (
            <CircularProgress size={28} />
          ) : (
            <>
              <Typography variant="subtitle1" sx={{ mb: 1 }}>
                {detail.originalFileName} · {detail.contract?.name}
              </Typography>
              <Typography variant="subtitle2" sx={{ mb: 1 }}>
                Não registradas
              </Typography>
              {pending.length === 0 ? (
                <Typography color="text.secondary" sx={{ mb: 2 }}>
                  Nenhuma linha pendente neste lançamento.
                </Typography>
              ) : (
                pending.map((line) => (
                  <ImportLineEditor
                    key={line.id}
                    importId={detail.id}
                    line={line}
                    readOnly={!canEdit}
                    onResolved={() => {
                      setLocalRefresh((current) => current + 1);
                      openDetail(detail.id);
                    }}
                  />
                ))
              )}
              <Typography variant="subtitle2" sx={{ mb: 1 }}>
                OS que entraram ({entered.length})
              </Typography>
              <Box sx={{ maxHeight: 240, overflow: "auto" }}>
                {entered.length === 0 ? (
                  <Typography color="text.secondary">Nenhuma OS entrou neste lançamento.</Typography>
                ) : (
                  entered.map((line) => (
                    <Typography key={line.id} variant="body2">
                      Linha {line.lineNumber}: {line.osNumber || "—"} · {line.sectorName || "—"} · {line.resultado || "—"}
                    </Typography>
                  ))
                )}
              </Box>
            </>
          )}
        </Box>
      )}
      <ConfirmDialog
        open={Boolean(pendingDelete)}
        title="Excluir ordens inseridas"
        description={
          pendingDelete
            ? insertedDeletionText(pendingDelete.serviceOrderCount, pendingDelete.inspectionCount)
            : ""
        }
        confirmLabel="Excluir"
        loading={deleting}
        onClose={() => {
          if (!deleting) setPendingDelete(null);
        }}
        onConfirm={confirmDelete}
      />
    </Box>
  );
}

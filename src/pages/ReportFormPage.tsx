import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Checkbox,
  CircularProgress,
  FormControl,
  FormControlLabel,
  FormGroup,
  FormHelperText,
  FormLabel,
  IconButton,
  MenuItem,
  Radio,
  RadioGroup,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { Delete, PictureAsPdf, Save } from "@mui/icons-material";
import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "react-toastify";
import {
  ReportFieldOption,
  ReportFileReference,
  ReportRecord,
  ReportType,
  ReportTypeField,
} from "@/domain";
import { appRepository } from "@/repositories/AppRepository";
import { generateReportPdf } from "@/utils/reportPdf";

function parseFieldOptions(options: unknown): ReportFieldOption[] {
  if (!Array.isArray(options)) return [];
  return options
    .map((entry) => {
      if (typeof entry === "string") return { label: entry, value: entry };
      if (!entry || typeof entry !== "object") return null;
      const value = String((entry as { value?: unknown }).value ?? "");
      if (!value) return null;
      const label = String((entry as { label?: unknown }).label ?? value);
      return { label, value };
    })
    .filter((entry): entry is ReportFieldOption => Boolean(entry));
}

function toReportFileReference(value: unknown, fallbackFieldKey: string): ReportFileReference | null {
  if (!value || typeof value !== "object") return null;
  const raw = value as Partial<ReportFileReference>;
  if (typeof raw.id !== "string" || typeof raw.url !== "string") return null;
  return {
    id: raw.id,
    fieldKey: typeof raw.fieldKey === "string" ? raw.fieldKey : fallbackFieldKey,
    originalName: typeof raw.originalName === "string" ? raw.originalName : "arquivo",
    mimeType: typeof raw.mimeType === "string" ? raw.mimeType : "image/jpeg",
    size: typeof raw.size === "number" ? raw.size : 0,
    url: raw.url,
    publicId: raw.publicId,
    reportRecordId: raw.reportRecordId,
    reportTypeId: raw.reportTypeId,
    storageKey: raw.storageKey,
    storageProvider: raw.storageProvider,
    createdAt: raw.createdAt,
    createdBy: raw.createdBy,
  };
}

function toFileArray(value: unknown, fieldKey: string): ReportFileReference[] {
  if (Array.isArray(value)) {
    return value
      .map((entry) => toReportFileReference(entry, fieldKey))
      .filter((entry): entry is ReportFileReference => Boolean(entry));
  }
  const single = toReportFileReference(value, fieldKey);
  return single ? [single] : [];
}

function getDefaultValue(field: ReportTypeField): unknown {
  if (field.defaultValue !== null && field.defaultValue !== undefined) return field.defaultValue;
  if (field.multiple) return [];
  if (field.type === "checkbox") return false;
  return "";
}

function buildInitialValues(fields: ReportTypeField[], source?: Record<string, unknown>): Record<string, unknown> {
  const values: Record<string, unknown> = {};
  for (const field of fields) {
    const sourceValue = source?.[field.fieldKey];
    if (sourceValue !== undefined) {
      if (field.type === "image" || field.type === "signature") {
        values[field.fieldKey] = field.multiple
          ? toFileArray(sourceValue, field.fieldKey)
          : toFileArray(sourceValue, field.fieldKey)[0] ?? null;
      } else {
        values[field.fieldKey] = sourceValue;
      }
      continue;
    }
    values[field.fieldKey] = getDefaultValue(field);
  }
  return values;
}

function hasRequiredValue(field: ReportTypeField, value: unknown): boolean {
  if (!field.required) return true;
  if (field.type === "image" || field.type === "signature") {
    const files = toFileArray(value, field.fieldKey);
    return files.length > 0;
  }
  if (field.multiple && Array.isArray(value)) {
    return value.length > 0;
  }
  if (field.type === "checkbox" && !field.multiple) {
    return Boolean(value);
  }
  if (typeof value === "number") return Number.isFinite(value);
  if (typeof value === "boolean") return value;
  if (value === null || value === undefined) return false;
  return String(value).trim().length > 0;
}

export const ReportFormPage = (): JSX.Element => {
  const { code = "", recordId = "" } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [uploadingByField, setUploadingByField] = useState<Record<string, boolean>>({});
  const [reportType, setReportType] = useState<ReportType | null>(null);
  const [fields, setFields] = useState<ReportTypeField[]>([]);
  const [formValues, setFormValues] = useState<Record<string, unknown>>({});
  const [savedRecord, setSavedRecord] = useState<ReportRecord | null>(null);

  useEffect(() => {
    const run = async () => {
      setLoading(true);
      setError(null);
      try {
        if (recordId) {
          const record = await appRepository.getReportRecord(recordId);
          const schema = await appRepository.getReportTypeFields(record.reportType.code);
          setReportType(record.reportType);
          setFields(schema.sort((a, b) => a.order - b.order));
          setSavedRecord(record);
          setFormValues(buildInitialValues(schema, record.formData));
          setValidationErrors({});
          return;
        }

        const [types, schema] = await Promise.all([
          appRepository.getReportTypes(),
          appRepository.getReportTypeFields(code),
        ]);
        const selectedType = types.find((entry) => entry.code === code) ?? null;
        if (!selectedType) {
          setError("Tipo de relatorio nao encontrado.");
          return;
        }
        setReportType(selectedType);
        setFields(schema.sort((a, b) => a.order - b.order));
        setFormValues((previous) => {
          const seeded = buildInitialValues(schema);
          return Object.keys(previous).length > 0 ? previous : seeded;
        });
        setValidationErrors({});
      } catch {
        setError("Nao foi possivel carregar o formulario dinamico deste relatorio.");
      } finally {
        setLoading(false);
      }
    };
    void run();
  }, [code, recordId]);

  const isUploading = useMemo(
    () => Object.values(uploadingByField).some(Boolean),
    [uploadingByField]
  );

  const updateFieldValue = (fieldKey: string, value: unknown) => {
    setFormValues((current) => ({ ...current, [fieldKey]: value }));
    setValidationErrors((current) => {
      if (!current[fieldKey]) return current;
      const next = { ...current };
      delete next[fieldKey];
      return next;
    });
  };

  const uploadFiles = async (field: ReportTypeField, selectedFiles: FileList | null) => {
    if (!selectedFiles || !reportType) return;
    const files = Array.from(selectedFiles);
    if (files.length === 0) return;
    setUploadingByField((current) => ({ ...current, [field.fieldKey]: true }));
    try {
      const uploaded: ReportFileReference[] = [];
      for (const file of files) {
        const result = await appRepository.uploadReportFile({
          file,
          reportTypeCode: reportType.code,
          fieldKey: field.fieldKey,
          reportRecordId: savedRecord?.id,
        });
        uploaded.push(result);
      }
      const currentFiles = toFileArray(formValues[field.fieldKey], field.fieldKey);
      updateFieldValue(
        field.fieldKey,
        field.multiple ? [...currentFiles, ...uploaded] : uploaded[0] ?? null
      );
    } catch {
      toast.error("Falha ao enviar imagem. Tente novamente.");
    } finally {
      setUploadingByField((current) => ({ ...current, [field.fieldKey]: false }));
    }
  };

  const removeFile = (field: ReportTypeField, fileId: string) => {
    const next = toFileArray(formValues[field.fieldKey], field.fieldKey).filter((file) => file.id !== fileId);
    updateFieldValue(field.fieldKey, field.multiple ? next : next[0] ?? null);
  };

  const validateForm = (): boolean => {
    const nextErrors: Record<string, string> = {};
    for (const field of fields) {
      if (!hasRequiredValue(field, formValues[field.fieldKey])) {
        nextErrors[field.fieldKey] = "Campo obrigatorio";
      }
    }
    setValidationErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const buildPayload = (): Record<string, unknown> => {
    const payload: Record<string, unknown> = {};
    for (const field of fields) {
      const value = formValues[field.fieldKey];
      if (field.type === "image" || field.type === "signature") {
        const files = toFileArray(value, field.fieldKey);
        payload[field.fieldKey] = field.multiple ? files.map((file) => file.id) : files[0]?.id ?? null;
        continue;
      }
      if (field.type === "number") {
        payload[field.fieldKey] = value === "" || value === null || value === undefined ? null : Number(value);
        continue;
      }
      payload[field.fieldKey] = value;
    }
    return payload;
  };

  const handleSave = async () => {
    if (!reportType) return;
    if (!validateForm()) {
      toast.error("Preencha os campos obrigatorios.");
      return;
    }
    setSaving(true);
    try {
      const created = await appRepository.createReportRecord({
        reportTypeCode: reportType.code,
        formData: buildPayload(),
      });
      setSavedRecord(created);
      setReportType(created.reportType);
      setFormValues(buildInitialValues(fields, created.formData));
      toast.success("Relatorio salvo com sucesso.");
      if (!recordId) {
        navigate(`/reports/records/${created.id}`, { replace: true });
      }
    } finally {
      setSaving(false);
    }
  };

  const handleGeneratePdf = async () => {
    if (!savedRecord) {
      toast.info("Salve o relatorio antes de gerar o PDF.");
      return;
    }
    try {
      await generateReportPdf({ record: savedRecord, fields });
    } catch {
      toast.error("Nao foi possivel gerar o PDF.");
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" p={4}>
        <CircularProgress />
      </Box>
    );
  }

  if (error || !reportType) {
    return <Alert severity="error">{error || "Tipo de relatorio nao encontrado."}</Alert>;
  }

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        {reportType.name}
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Preencha os campos abaixo, envie as imagens necessarias e salve para gerar o PDF.
      </Typography>

      {savedRecord && (
        <Alert severity="success" sx={{ mb: 2 }}>
          Registro salvo com ID: {savedRecord.id}
        </Alert>
      )}

      <Card>
        <CardContent>
          <Stack spacing={2}>
            {fields.map((field) => {
              const value = formValues[field.fieldKey];
              const requiredError = validationErrors[field.fieldKey];
              const options = parseFieldOptions(field.options);

              if (field.type === "textarea") {
                return (
                  <TextField
                    key={field.id}
                    label={field.label}
                    value={typeof value === "string" ? value : ""}
                    onChange={(event) => updateFieldValue(field.fieldKey, event.target.value)}
                    required={field.required}
                    error={Boolean(requiredError)}
                    helperText={requiredError || field.helpText || ""}
                    multiline
                    rows={4}
                    fullWidth
                  />
                );
              }

              if (field.type === "text" || field.type === "date" || field.type === "datetime" || field.type === "number") {
                return (
                  <TextField
                    key={field.id}
                    label={field.label}
                    value={value === null || value === undefined ? "" : String(value)}
                    onChange={(event) => updateFieldValue(field.fieldKey, event.target.value)}
                    required={field.required}
                    error={Boolean(requiredError)}
                    helperText={requiredError || field.helpText || ""}
                    type={
                      field.type === "date"
                        ? "date"
                        : field.type === "datetime"
                          ? "datetime-local"
                          : field.type === "number"
                            ? "number"
                            : "text"
                    }
                    InputLabelProps={field.type === "date" || field.type === "datetime" ? { shrink: true } : undefined}
                    fullWidth
                  />
                );
              }

              if (field.type === "select") {
                return (
                  <TextField
                    key={field.id}
                    select
                    label={field.label}
                    value={typeof value === "string" ? value : ""}
                    onChange={(event) => updateFieldValue(field.fieldKey, event.target.value)}
                    required={field.required}
                    error={Boolean(requiredError)}
                    helperText={requiredError || field.helpText || ""}
                    fullWidth
                  >
                    {options.map((option) => (
                      <MenuItem key={option.value} value={option.value}>
                        {option.label}
                      </MenuItem>
                    ))}
                  </TextField>
                );
              }

              if (field.type === "radio") {
                return (
                  <FormControl key={field.id} error={Boolean(requiredError)} required={field.required}>
                    <FormLabel>{field.label}</FormLabel>
                    <RadioGroup
                      value={typeof value === "string" ? value : ""}
                      onChange={(event) => updateFieldValue(field.fieldKey, event.target.value)}
                    >
                      {options.map((option) => (
                        <FormControlLabel
                          key={option.value}
                          value={option.value}
                          control={<Radio />}
                          label={option.label}
                        />
                      ))}
                    </RadioGroup>
                    <FormHelperText>{requiredError || field.helpText || ""}</FormHelperText>
                  </FormControl>
                );
              }

              if (field.type === "checkbox") {
                if (field.multiple) {
                  const selected = Array.isArray(value) ? (value as string[]) : [];
                  return (
                    <FormControl key={field.id} error={Boolean(requiredError)} required={field.required}>
                      <FormLabel>{field.label}</FormLabel>
                      <FormGroup>
                        {options.map((option) => (
                          <FormControlLabel
                            key={option.value}
                            control={
                              <Checkbox
                                checked={selected.includes(option.value)}
                                onChange={(event) => {
                                  const next = event.target.checked
                                    ? [...selected, option.value]
                                    : selected.filter((entry) => entry !== option.value);
                                  updateFieldValue(field.fieldKey, next);
                                }}
                              />
                            }
                            label={option.label}
                          />
                        ))}
                      </FormGroup>
                      <FormHelperText>{requiredError || field.helpText || ""}</FormHelperText>
                    </FormControl>
                  );
                }
                return (
                  <FormControl key={field.id} error={Boolean(requiredError)} required={field.required}>
                    <FormGroup>
                      <FormControlLabel
                        control={
                          <Checkbox
                            checked={Boolean(value)}
                            onChange={(event) => updateFieldValue(field.fieldKey, event.target.checked)}
                          />
                        }
                        label={field.label}
                      />
                    </FormGroup>
                    <FormHelperText>{requiredError || field.helpText || ""}</FormHelperText>
                  </FormControl>
                );
              }

              const files = toFileArray(value, field.fieldKey);
              return (
                <FormControl key={field.id} error={Boolean(requiredError)} required={field.required}>
                  <FormLabel>{field.label}</FormLabel>
                  <Stack direction="row" alignItems="center" spacing={1} mt={1}>
                    <Button
                      variant="outlined"
                      component="label"
                      disabled={Boolean(uploadingByField[field.fieldKey]) || saving}
                    >
                      {uploadingByField[field.fieldKey] ? "Enviando..." : "Selecionar imagem"}
                      <input
                        hidden
                        type="file"
                        accept="image/*"
                        multiple={field.multiple}
                        onChange={(event) => void uploadFiles(field, event.target.files)}
                      />
                    </Button>
                    {uploadingByField[field.fieldKey] && <CircularProgress size={20} />}
                  </Stack>

                  {files.length > 0 && (
                    <Stack direction="row" spacing={1} flexWrap="wrap" mt={1}>
                      {files.map((file) => (
                        <Box key={file.id} sx={{ position: "relative" }}>
                          <img
                            src={file.url}
                            alt={file.originalName}
                            style={{ width: 120, height: 90, objectFit: "cover", borderRadius: 6 }}
                          />
                          <IconButton
                            size="small"
                            color="error"
                            onClick={() => removeFile(field, file.id)}
                            sx={{ position: "absolute", right: 2, top: 2, bgcolor: "rgba(255,255,255,0.8)" }}
                          >
                            <Delete fontSize="small" />
                          </IconButton>
                        </Box>
                      ))}
                    </Stack>
                  )}

                  <FormHelperText>{requiredError || field.helpText || ""}</FormHelperText>
                </FormControl>
              );
            })}
          </Stack>
        </CardContent>
      </Card>

      <Box mt={2} display="flex" gap={1} justifyContent="flex-end">
        <Button variant="outlined" onClick={() => navigate("/reports/new")}>
          Voltar
        </Button>
        <Button
          variant="outlined"
          startIcon={<PictureAsPdf />}
          onClick={() => void handleGeneratePdf()}
          disabled={!savedRecord}
        >
          Gerar PDF
        </Button>
        <Button
          variant="contained"
          startIcon={saving ? <CircularProgress size={20} color="inherit" /> : <Save />}
          onClick={() => void handleSave()}
          disabled={saving || isUploading}
        >
          {saving ? "Salvando..." : "Salvar relatorio"}
        </Button>
      </Box>
    </Box>
  );
};

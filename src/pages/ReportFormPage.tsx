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
import { Delete, PictureAsPdf } from "@mui/icons-material";
import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "react-toastify";
import { ReportFieldOption, ReportType, ReportTypeField } from "@/domain";
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

interface LocalMediaFile {
  id: string;
  name: string;
  dataUrl: string;
  title?: string;
}

function toLocalMediaFile(value: unknown): LocalMediaFile | null {
  if (!value || typeof value !== "object") return null;
  const raw = value as Partial<LocalMediaFile>;
  if (typeof raw.id !== "string" || typeof raw.name !== "string" || typeof raw.dataUrl !== "string") {
    return null;
  }
  return {
    id: raw.id,
    name: raw.name,
    dataUrl: raw.dataUrl,
    title: typeof raw.title === "string" ? raw.title : "",
  };
}

function toFileArray(value: unknown): LocalMediaFile[] {
  if (Array.isArray(value)) {
    return value.map(toLocalMediaFile).filter((entry): entry is LocalMediaFile => Boolean(entry));
  }
  const single = toLocalMediaFile(value);
  return single ? [single] : [];
}

function getDefaultValue(field: ReportTypeField): unknown {
  if (field.defaultValue !== null && field.defaultValue !== undefined) return field.defaultValue;
  if (field.multiple) return [];
  if (field.type === "checkbox") return false;
  return "";
}

function buildInitialValues(fields: ReportTypeField[]): Record<string, unknown> {
  const values: Record<string, unknown> = {};
  for (const field of fields) {
    values[field.fieldKey] = getDefaultValue(field);
  }
  return values;
}

function hasRequiredValue(field: ReportTypeField, value: unknown): boolean {
  if (!field.required) return true;
  if (field.type === "image" || field.type === "signature") {
    const files = toFileArray(value);
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
  const { code = "" } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [generatingPdf, setGeneratingPdf] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [reportType, setReportType] = useState<ReportType | null>(null);
  const [fields, setFields] = useState<ReportTypeField[]>([]);
  const [formValues, setFormValues] = useState<Record<string, unknown>>({});

  useEffect(() => {
    const run = async () => {
      setLoading(true);
      setError(null);
      try {
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
  }, [code]);

  const isGenerating = useMemo(() => generatingPdf, [generatingPdf]);

  const updateFieldValue = (fieldKey: string, value: unknown) => {
    setFormValues((current) => ({ ...current, [fieldKey]: value }));
    setValidationErrors((current) => {
      if (!current[fieldKey]) return current;
      const next = { ...current };
      delete next[fieldKey];
      return next;
    });
  };

  const readFileAsDataUrl = async (file: File): Promise<string> =>
    await new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result ?? ""));
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });

  const uploadFiles = async (field: ReportTypeField, selectedFiles: FileList | null) => {
    if (!selectedFiles) return;
    const files = Array.from(selectedFiles);
    if (files.length === 0) return;
    try {
      const uploaded: LocalMediaFile[] = [];
      for (const file of files) {
        if (!file.type.startsWith("image/")) {
          continue;
        }
        const dataUrl = await readFileAsDataUrl(file);
        uploaded.push({
          id: crypto.randomUUID(),
          name: file.name,
          dataUrl,
        });
      }
      const currentFiles = toFileArray(formValues[field.fieldKey]);
      updateFieldValue(
        field.fieldKey,
        field.multiple ? [...currentFiles, ...uploaded] : uploaded[0] ?? null
      );
    } catch {
      toast.error("Falha ao processar imagem localmente.");
    }
  };

  const removeFile = (field: ReportTypeField, fileId: string) => {
    const next = toFileArray(formValues[field.fieldKey]).filter((file) => file.id !== fileId);
    updateFieldValue(field.fieldKey, field.multiple ? next : next[0] ?? null);
  };

  const updateFileTitle = (field: ReportTypeField, fileId: string, title: string) => {
    const next = toFileArray(formValues[field.fieldKey]).map((file) =>
      file.id === fileId ? { ...file, title } : file
    );
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

  const handleGeneratePdf = async () => {
    if (!reportType) return;
    if (!validateForm()) {
      toast.error("Preencha os campos obrigatorios.");
      return;
    }
    setGeneratingPdf(true);
    try {
      await generateReportPdf({
        reportType,
        fields,
        formData: formValues,
      });
    } catch {
      toast.error("Nao foi possivel gerar o PDF.");
    } finally {
      setGeneratingPdf(false);
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
        Preencha os campos abaixo e gere o PDF diretamente no frontend.
      </Typography>

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

              const files = toFileArray(value);
              return (
                <FormControl key={field.id} error={Boolean(requiredError)} required={field.required}>
                  <FormLabel>{field.label}</FormLabel>
                  <Stack direction="row" alignItems="center" spacing={1} mt={1}>
                    <Button
                      variant="outlined"
                      component="label"
                      disabled={isGenerating}
                    >
                      Selecionar imagem
                      <input
                        hidden
                        type="file"
                        accept="image/*"
                        multiple={field.multiple}
                        onChange={(event) => void uploadFiles(field, event.target.files)}
                      />
                    </Button>
                  </Stack>

                  {files.length > 0 && (
                    <Box
                      mt={1.5}
                      sx={{
                        display: "grid",
                        gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))",
                        gap: 1.5,
                      }}
                    >
                      {files.map((file) => (
                        <Box
                          key={file.id}
                          sx={{
                            position: "relative",
                            border: "1px solid",
                            borderColor: "divider",
                            borderRadius: 1,
                            p: 1,
                            bgcolor: "background.paper",
                          }}
                        >
                          <img
                            src={file.dataUrl}
                            alt={file.name}
                            style={{ width: "100%", height: 130, objectFit: "cover", borderRadius: 6 }}
                          />
                          <IconButton
                            size="small"
                            color="error"
                            onClick={() => removeFile(field, file.id)}
                            sx={{ position: "absolute", right: 2, top: 2, bgcolor: "rgba(255,255,255,0.8)" }}
                          >
                            <Delete fontSize="small" />
                          </IconButton>
                          <TextField
                            size="small"
                            label="Titulo da foto"
                            value={file.title ?? ""}
                            onChange={(event) => updateFileTitle(field, file.id, event.target.value)}
                            disabled={isGenerating}
                            sx={{ mt: 1, width: "100%" }}
                          />
                        </Box>
                      ))}
                    </Box>
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
          variant="contained"
          startIcon={isGenerating ? <CircularProgress size={20} color="inherit" /> : <PictureAsPdf />}
          onClick={() => void handleGeneratePdf()}
          disabled={isGenerating}
        >
          {isGenerating ? "Gerando..." : "Gerar PDF"}
        </Button>
      </Box>
    </Box>
  );
};

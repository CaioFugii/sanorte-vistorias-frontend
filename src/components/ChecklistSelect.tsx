import { FormControl, FormHelperText, InputLabel, MenuItem, Select, SelectChangeEvent, Button } from "@mui/material";
import { InspectionScope, ModuleType } from "@/domain";
import { Checklist } from "@/domain";
import { appRepository } from "@/repositories/AppRepository";
import { useEffect, useRef, useState } from "react";

interface ChecklistSelectProps {
  value: string;
  onChange: (checklistId: string, checklist?: Checklist) => void;
  module?: ModuleType;
  inspectionScope?: InspectionScope;
  sectorId?: string;
  disabled?: boolean;
  required?: boolean;
  helperText?: string;
  onLoadingChange?: (loading: boolean) => void;
}

export function ChecklistSelect({
  value,
  onChange,
  module,
  inspectionScope,
  sectorId,
  disabled,
  required,
  helperText,
  onLoadingChange,
}: ChecklistSelectProps): JSX.Element {
  const [checklists, setChecklists] = useState<Checklist[]>([]);
  const [loadingOptions, setLoadingOptions] = useState(false);
  const [loadFailed, setLoadFailed] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const hasMountedRef = useRef(false);
  const prevModuleRef = useRef<ModuleType | undefined>(module);

  useEffect(() => {
    if (!module) return;

    const moduleChanged = hasMountedRef.current && prevModuleRef.current !== module;
    const shouldFetch = Boolean(sectorId) || moduleChanged;

    if (!shouldFetch) {
      setChecklists([]);
      setLoadFailed(false);
      setLoadingOptions(false);
      onLoadingChange?.(false);
      return;
    }
    let cancelled = false;
    onLoadingChange?.(true);
    setLoadingOptions(true);
    setLoadFailed(false);
    appRepository
      .getChecklists({ ...(sectorId ? { sectorId } : {}), module, inspectionScope, page: 1, limit: 100 })
      .then((res) => {
        if (!cancelled) {
          setChecklists(res.data);
          setLoadFailed(false);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setChecklists([]);
          setLoadFailed(true);
        }
      })
      .finally(() => {
        if (!cancelled) {
          setLoadingOptions(false);
          onLoadingChange?.(false);
        }
      });
    return () => {
      cancelled = true;
      onLoadingChange?.(false);
    };
  }, [sectorId, module, inspectionScope, onLoadingChange, retryCount]);

  useEffect(() => {
    hasMountedRef.current = true;
    prevModuleRef.current = module;
  }, [module]);

  const handleChange = (event: SelectChangeEvent<string>) => {
    const nextId = event.target.value;
    onChange(
      nextId,
      checklists.find((checklist) => checklist.id === nextId)
    );
  };
  const hasNoOptions = checklists.length === 0;

  return (
    <>
      <FormControl fullWidth required={required} disabled={disabled || hasNoOptions}>
        <InputLabel>Checklist</InputLabel>
        <Select value={value} label="Checklist" onChange={handleChange}>
          {checklists.map((checklist) => (
            <MenuItem key={checklist.id} value={checklist.id}>
              {checklist.name}
            </MenuItem>
          ))}
        </Select>
        {loadingOptions ? (
          <FormHelperText>Carregando checklists...</FormHelperText>
        ) : loadFailed ? (
          <FormHelperText error>Não foi possível carregar os checklists.</FormHelperText>
        ) : helperText ? (
          <FormHelperText>{helperText}</FormHelperText>
        ) : null}
      </FormControl>
      {loadFailed ? (
        <Button type="button" size="small" sx={{ mt: 1 }} onClick={() => setRetryCount((current) => current + 1)}>
          Tentar carregar checklists novamente
        </Button>
      ) : null}
    </>
  );
}

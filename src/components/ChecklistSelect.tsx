import { FormControl, InputLabel, MenuItem, Select, SelectChangeEvent } from "@mui/material";
import { InspectionScope, ModuleType } from "@/domain";
import { Checklist } from "@/domain";
import { appRepository } from "@/repositories/AppRepository";
import { useEffect, useRef, useState } from "react";

interface ChecklistSelectProps {
  value: string;
  onChange: (checklistId: string) => void;
  module?: ModuleType;
  inspectionScope?: InspectionScope;
  sectorId?: string;
  disabled?: boolean;
  required?: boolean;
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
  onLoadingChange,
}: ChecklistSelectProps): JSX.Element {
  const [checklists, setChecklists] = useState<Checklist[]>([]);
  const hasMountedRef = useRef(false);
  const prevModuleRef = useRef<ModuleType | undefined>(module);

  useEffect(() => {
    if (!module) return;

    const moduleChanged = hasMountedRef.current && prevModuleRef.current !== module;
    const shouldFetch = Boolean(sectorId) || moduleChanged;

    if (!shouldFetch) {
      setChecklists([]);
      onLoadingChange?.(false);
      return;
    }
    let cancelled = false;
    onLoadingChange?.(true);
    appRepository
      .getChecklists({ ...(sectorId ? { sectorId } : {}), module, inspectionScope, page: 1, limit: 100 })
      .then((res) => {
        if (!cancelled) setChecklists(res.data);
      })
      .catch(() => {
        if (!cancelled) setChecklists([]);
      })
      .finally(() => {
        if (!cancelled) onLoadingChange?.(false);
      });
    return () => {
      cancelled = true;
      onLoadingChange?.(false);
    };
  }, [sectorId, module, inspectionScope, onLoadingChange]);

  useEffect(() => {
    hasMountedRef.current = true;
    prevModuleRef.current = module;
  }, [module]);

  const handleChange = (event: SelectChangeEvent<string>) => onChange(event.target.value);
  const hasNoOptions = checklists.length === 0;

  return (
    <FormControl fullWidth required={required} disabled={disabled || hasNoOptions}>
      <InputLabel>Checklist</InputLabel>
      <Select value={value} label="Checklist" onChange={handleChange}>
        {checklists.map((checklist) => (
          <MenuItem key={checklist.id} value={checklist.id}>
            {checklist.name}
          </MenuItem>
        ))}
      </Select>
    </FormControl>
  );
}

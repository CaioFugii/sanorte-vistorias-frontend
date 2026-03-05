import { FormControl, InputLabel, MenuItem, Select, SelectChangeEvent } from "@mui/material";
import { ModuleType } from "@/domain";
import { Checklist } from "@/domain";
import { appRepository } from "@/repositories/AppRepository";
import { useEffect, useState } from "react";

interface ChecklistSelectProps {
  value: string;
  onChange: (checklistId: string) => void;
  module?: ModuleType;
  sectorId?: string;
  disabled?: boolean;
  required?: boolean;
  onLoadingChange?: (loading: boolean) => void;
}

export function ChecklistSelect({
  value,
  onChange,
  module,
  sectorId,
  disabled,
  required,
  onLoadingChange,
}: ChecklistSelectProps): JSX.Element {
  const [checklists, setChecklists] = useState<Checklist[]>([]);

  useEffect(() => {
    if (!sectorId || !module) {
      setChecklists([]);
      onLoadingChange?.(false);
      return;
    }
    let cancelled = false;
    onLoadingChange?.(true);
    appRepository
      .getChecklists({ sectorId, module, page: 1, limit: 100 })
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
  }, [sectorId, module, onLoadingChange]);

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

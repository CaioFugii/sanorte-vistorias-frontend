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
}

export function ChecklistSelect({
  value,
  onChange,
  module,
  sectorId,
  disabled,
  required,
}: ChecklistSelectProps): JSX.Element {
  const [checklists, setChecklists] = useState<Checklist[]>([]);

  useEffect(() => {
    if (!sectorId || !module) {
      setChecklists([]);
      return;
    }
    let cancelled = false;
    appRepository
      .getChecklists({ sectorId, module, page: 1, limit: 100 })
      .then((res) => {
        if (!cancelled) setChecklists(res.data);
      })
      .catch(() => {
        if (!cancelled) setChecklists([]);
      });
    return () => {
      cancelled = true;
    };
  }, [sectorId, module]);

  const handleChange = (event: SelectChangeEvent<string>) => onChange(event.target.value);

  return (
    <FormControl fullWidth required={required} disabled={disabled}>
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

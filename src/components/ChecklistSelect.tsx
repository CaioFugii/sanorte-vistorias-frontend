import { FormControl, InputLabel, MenuItem, Select, SelectChangeEvent } from "@mui/material";
import { useReferenceStore } from "@/stores/referenceStore";
import { ModuleType } from "@/domain";

interface ChecklistSelectProps {
  value: string;
  onChange: (checklistId: string) => void;
  module?: ModuleType;
  disabled?: boolean;
  required?: boolean;
}

export function ChecklistSelect({
  value,
  onChange,
  module,
  disabled,
  required,
}: ChecklistSelectProps): JSX.Element {
  const checklists = useReferenceStore((state) => state.checklists);
  const visibleChecklists = module
    ? checklists.filter((checklist) => checklist.module === module)
    : checklists;
  const handleChange = (event: SelectChangeEvent<string>) => onChange(event.target.value);

  return (
    <FormControl fullWidth required={required} disabled={disabled}>
      <InputLabel>Checklist</InputLabel>
      <Select value={value} label="Checklist" onChange={handleChange}>
        {visibleChecklists.map((checklist) => (
          <MenuItem key={checklist.id} value={checklist.id}>
            {checklist.name}
          </MenuItem>
        ))}
      </Select>
    </FormControl>
  );
}

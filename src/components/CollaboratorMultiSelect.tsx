import { useMemo } from "react";
import {
  Checkbox,
  Chip,
  FormControl,
  InputLabel,
  ListItemText,
  MenuItem,
  OutlinedInput,
  Select,
  SelectChangeEvent,
} from "@mui/material";
import { Collaborator } from "@/domain";

interface CollaboratorMultiSelectProps {
  value: string[];
  onChange: (collaboratorIds: string[]) => void;
  collaborators: Collaborator[];
  label?: string;
  disabled?: boolean;
}

export const CollaboratorMultiSelect = ({
  value,
  onChange,
  collaborators,
  label = "Colaboradores",
  disabled = false,
}: CollaboratorMultiSelectProps): JSX.Element => {
  const collaboratorsById = useMemo(
    () => new Map(collaborators.map((collaborator) => [collaborator.id, collaborator])),
    [collaborators]
  );

  const handleChange = (event: SelectChangeEvent<string[]>) => {
    const nextValue = event.target.value;
    onChange(typeof nextValue === "string" ? nextValue.split(",") : nextValue);
  };

  return (
    <FormControl fullWidth disabled={disabled}>
      <InputLabel>{label}</InputLabel>
      <Select
        multiple
        value={value}
        onChange={handleChange}
        input={<OutlinedInput label={label} />}
        renderValue={(selected) => (
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            {selected.map((id) => (
              <Chip
                key={id}
                size="small"
                label={collaboratorsById.get(id)?.name ?? id}
              />
            ))}
          </div>
        )}
      >
        {collaborators.map((collaborator) => (
          <MenuItem key={collaborator.id} value={collaborator.id}>
            <Checkbox checked={value.includes(collaborator.id)} />
            <ListItemText primary={collaborator.name} />
          </MenuItem>
        ))}
      </Select>
    </FormControl>
  );
};

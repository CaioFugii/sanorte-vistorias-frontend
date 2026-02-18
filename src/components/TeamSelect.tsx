import { FormControl, InputLabel, MenuItem, Select, SelectChangeEvent } from "@mui/material";
import { useReferenceStore } from "@/stores/referenceStore";

interface TeamSelectProps {
  value: string;
  onChange: (teamId: string) => void;
  label?: string;
  required?: boolean;
  disabled?: boolean;
  onlyActive?: boolean;
}

export const TeamSelect = ({
  value,
  onChange,
  label = 'Equipe',
  required = false,
  disabled = false,
  onlyActive = true,
}: TeamSelectProps) => {
  const teams = useReferenceStore((state) => state.teams);

  const handleChange = (event: SelectChangeEvent<string>) => {
    onChange(event.target.value);
  };
  const filtered = onlyActive ? teams.filter((team) => team.active) : teams;

  return (
    <FormControl fullWidth required={required} disabled={disabled}>
      <InputLabel>{label}</InputLabel>
      <Select value={value} onChange={handleChange} label={label}>
        {filtered.map((team) => (
          <MenuItem key={team.id} value={team.id}>
            {team.name}
          </MenuItem>
        ))}
      </Select>
    </FormControl>
  );
};

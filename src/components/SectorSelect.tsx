import { FormControl, InputLabel, MenuItem, Select, SelectChangeEvent } from "@mui/material";
import { useReferenceStore } from "@/stores/referenceStore";
import { Sector } from "@/domain";

interface SectorSelectProps {
  value: string;
  onChange: (sectorId: string) => void;
  label?: string;
  required?: boolean;
  disabled?: boolean;
  onlyActive?: boolean;
  options?: Sector[];
}

export const SectorSelect = ({
  value,
  onChange,
  label = "Setor",
  required = false,
  disabled = false,
  onlyActive = true,
  options,
}: SectorSelectProps): JSX.Element => {
  const cachedSectors = useReferenceStore((state) => state.sectors);
  const sectors = options ?? cachedSectors;
  const filtered = onlyActive ? sectors.filter((sector) => sector.active) : sectors;

  const handleChange = (event: SelectChangeEvent<string>) => {
    onChange(event.target.value);
  };

  return (
    <FormControl fullWidth required={required} disabled={disabled}>
      <InputLabel>{label}</InputLabel>
      <Select value={value} onChange={handleChange} label={label}>
        {filtered.map((sector) => (
          <MenuItem key={sector.id} value={sector.id}>
            {sector.name}
          </MenuItem>
        ))}
      </Select>
    </FormControl>
  );
};

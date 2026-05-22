import { FormControl, FormHelperText, InputLabel, MenuItem, Select, SelectChangeEvent } from "@mui/material";
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
  helperText?: string;
}

export const SectorSelect = ({
  value,
  onChange,
  label = "Setor",
  required = false,
  disabled = false,
  onlyActive = true,
  options,
  helperText,
}: SectorSelectProps): JSX.Element => {
  const cachedSectors = useReferenceStore((state) => state.sectors);
  const sectors = options ?? cachedSectors;
  const filtered = onlyActive ? sectors.filter((sector) => sector.active) : sectors;
  const hasNoOptions = filtered.length === 0;
  const effectiveDisabled = disabled || hasNoOptions;

  const handleChange = (event: SelectChangeEvent<string>) => {
    onChange(event.target.value);
  };

  return (
    <FormControl fullWidth required={required} disabled={effectiveDisabled}>
      <InputLabel>{label}</InputLabel>
      <Select value={value} onChange={handleChange} label={label}>
        {filtered.map((sector) => (
          <MenuItem key={sector.id} value={sector.id}>
            {sector.name}
          </MenuItem>
        ))}
      </Select>
      {(helperText || hasNoOptions) && (
        <FormHelperText>{helperText ?? "Nenhum setor ativo disponível."}</FormHelperText>
      )}
    </FormControl>
  );
};

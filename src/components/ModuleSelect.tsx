import { Select, MenuItem, FormControl, InputLabel, SelectChangeEvent } from '@mui/material';
import { ModuleType } from '@/domain';

interface ModuleSelectProps {
  value: ModuleType | '';
  onChange: (value: ModuleType) => void;
  label?: string;
  required?: boolean;
  disabled?: boolean;
}

const moduleLabels: Record<ModuleType, string> = {
  [ModuleType.CAMPO]: 'QUALIDADE - Campo',
  [ModuleType.SEGURANCA_TRABALHO]: 'SST - Segurança do Trabalho',
  [ModuleType.POS_OBRA]: 'QUALIDADE - Pós Obra',
  [ModuleType.REMOTO]: 'QUALIDADE - Remoto',
};

export const ModuleSelect = ({
  value,
  onChange,
  label = 'Módulo',
  required = false,
  disabled = false,
}: ModuleSelectProps) => {
  const handleChange = (event: SelectChangeEvent<ModuleType | ''>) => {
    onChange(event.target.value as ModuleType);
  };

  return (
    <FormControl fullWidth required={required} disabled={disabled}>
      <InputLabel>{label}</InputLabel>
      <Select value={value} onChange={handleChange} label={label}>
        {Object.values(ModuleType).map((module) => (
          <MenuItem key={module} value={module}>
            {moduleLabels[module]}
          </MenuItem>
        ))}
      </Select>
    </FormControl>
  );
};

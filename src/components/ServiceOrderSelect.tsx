import { FormControl, InputLabel, MenuItem, Select, SelectChangeEvent } from "@mui/material";
import { useReferenceStore } from "@/stores/referenceStore";
import { ModuleType } from "@/domain/enums";
import { useEffect } from "react";

interface ServiceOrderSelectProps {
  value: string;
  onChange: (serviceOrderId: string) => void;
  sectorId?: string;
  module?: ModuleType;
  label?: string;
  required?: boolean;
  disabled?: boolean;
}

export const ServiceOrderSelect = ({
  value,
  onChange,
  sectorId,
  module,
  label = "Ordem de Serviço (OS)",
  required = false,
  disabled = false,
}: ServiceOrderSelectProps) => {
  const serviceOrders = useReferenceStore((state) => state.serviceOrders);
  const loadServiceOrders = useReferenceStore((state) => state.loadServiceOrders);

  useEffect(() => {
    loadServiceOrders(sectorId, module);
  }, [loadServiceOrders, sectorId, module]);

  const handleChange = (event: SelectChangeEvent<string>) => {
    onChange(event.target.value);
  };
  const hasNoOptions = serviceOrders.length === 0;

  return (
    <FormControl fullWidth required={required} disabled={disabled || hasNoOptions}>
      <InputLabel>{label}</InputLabel>
      <Select value={value} onChange={handleChange} label={label}>
        <MenuItem value="">
          <em>Selecione uma OS</em>
        </MenuItem>
        {serviceOrders.map((so) => (
          <MenuItem key={so.id} value={so.id}>
            {so.osNumber} - {so.sector?.name}
          </MenuItem>
        ))}
      </Select>
    </FormControl>
  );
};

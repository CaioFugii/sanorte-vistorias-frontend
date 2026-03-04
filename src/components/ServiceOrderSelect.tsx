import { FormControl, InputLabel, MenuItem, Select, SelectChangeEvent } from "@mui/material";
import { useReferenceStore } from "@/stores/referenceStore";
import { useEffect } from "react";

interface ServiceOrderSelectProps {
  value: string;
  onChange: (serviceOrderId: string) => void;
  label?: string;
  required?: boolean;
  disabled?: boolean;
}

export const ServiceOrderSelect = ({
  value,
  onChange,
  label = "Ordem de Serviço (OS)",
  required = false,
  disabled = false,
}: ServiceOrderSelectProps) => {
  const serviceOrders = useReferenceStore((state) => state.serviceOrders);
  const loadServiceOrders = useReferenceStore((state) => state.loadServiceOrders);

  useEffect(() => {
    loadServiceOrders();
  }, [loadServiceOrders]);

  const handleChange = (event: SelectChangeEvent<string>) => {
    onChange(event.target.value);
  };

  return (
    <FormControl fullWidth required={required} disabled={disabled}>
      <InputLabel>{label}</InputLabel>
      <Select value={value} onChange={handleChange} label={label}>
        <MenuItem value="">
          <em>Selecione uma OS</em>
        </MenuItem>
        {serviceOrders.map((so) => (
          <MenuItem key={so.id} value={so.id}>
            {so.osNumber} - {so.address}
          </MenuItem>
        ))}
      </Select>
    </FormControl>
  );
};

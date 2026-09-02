import { TextField } from "@mui/material";
import { maskBrDateInput, toBrDateInput } from "@/utils/brDate";

interface BrDateFieldProps {
  label: string;
  value: unknown;
  onChange: (value: string) => void;
  required?: boolean;
  error?: boolean;
  helperText?: string;
}

export const BrDateField = ({
  label,
  value,
  onChange,
  required,
  error,
  helperText,
}: BrDateFieldProps): JSX.Element => {
  const display = toBrDateInput(value === null || value === undefined ? "" : String(value));

  return (
    <TextField
      label={label}
      value={display}
      onChange={(event) => onChange(maskBrDateInput(event.target.value))}
      required={required}
      error={error}
      helperText={helperText}
      placeholder="dd/MM/yyyy"
      InputLabelProps={{ shrink: true }}
      inputProps={{ inputMode: "numeric", maxLength: 10 }}
      fullWidth
    />
  );
};

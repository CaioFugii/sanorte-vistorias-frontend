import { ChecklistAnswer } from "@/domain/enums";
import { FormControlLabel, Radio, RadioGroup } from "@mui/material";

interface AnswerRadioGroupProps {
  value?: ChecklistAnswer;
  onChange: (value: ChecklistAnswer) => void;
  disabled?: boolean;
}

export function AnswerRadioGroup({
  value,
  onChange,
  disabled,
}: AnswerRadioGroupProps): JSX.Element {
  return (
    <RadioGroup
      row
      value={value ?? ""}
      onChange={(event) => onChange(event.target.value as ChecklistAnswer)}
    >
      <FormControlLabel
        value={ChecklistAnswer.CONFORME}
        control={<Radio />}
        label="Conforme"
        disabled={disabled}
      />
      <FormControlLabel
        value={ChecklistAnswer.NAO_CONFORME}
        control={<Radio />}
        label="Não Conforme"
        disabled={disabled}
      />
      <FormControlLabel
        value={ChecklistAnswer.NAO_APLICAVEL}
        control={<Radio />}
        label="Não Aplicável"
        disabled={disabled}
      />
    </RadioGroup>
  );
}

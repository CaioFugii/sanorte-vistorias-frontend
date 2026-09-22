import { Box, Chip, TextField } from "@mui/material";
import { KeyboardEvent, useState } from "react";

const MAX_SUGGESTIONS = 20;
const MAX_SUGGESTION_LENGTH = 80;

function normalizeDraft(value: string): string {
  return value.trim();
}

export function ServiceDescriptionSuggestionsField({
  value,
  onChange,
  disabled,
}: {
  value: string[];
  onChange: (next: string[]) => void;
  disabled?: boolean;
}): JSX.Element {
  const [draft, setDraft] = useState("");

  const addSuggestion = (): void => {
    const name = normalizeDraft(draft);
    if (!name || disabled) return;
    if (name.length > MAX_SUGGESTION_LENGTH) return;
    if (value.length >= MAX_SUGGESTIONS) return;
    const exists = value.some((item) => item.toLowerCase() === name.toLowerCase());
    if (exists) {
      setDraft("");
      return;
    }
    onChange([...value, name]);
    setDraft("");
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>): void => {
    if (event.key !== "Enter") return;
    event.preventDefault();
    addSuggestion();
  };

  return (
    <Box mt={1}>
      <TextField
        margin="normal"
        fullWidth
        label="Sugestões de descrição do serviço"
        value={draft}
        onChange={(event) => setDraft(event.target.value)}
        onKeyDown={handleKeyDown}
        onBlur={addSuggestion}
        disabled={disabled || value.length >= MAX_SUGGESTIONS}
        inputProps={{ maxLength: MAX_SUGGESTION_LENGTH }}
        helperText="Opcional. Pressione Enter para incluir. O fiscal pode clicar na sugestão ao criar a vistoria."
      />
      {value.length > 0 && (
        <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1, mt: 0.5 }}>
          {value.map((suggestion) => (
            <Chip
              key={suggestion}
              label={suggestion}
              onDelete={disabled ? undefined : () => onChange(value.filter((item) => item !== suggestion))}
            />
          ))}
        </Box>
      )}
    </Box>
  );
}

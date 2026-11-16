import { useState } from "react";
import { Box, IconButton, Popover, Typography } from "@mui/material";
import { CalendarMonth, ChevronLeft, ChevronRight } from "@mui/icons-material";
import {
  currentMonthKey,
  formatMonthKeyLabel,
  isFutureMonth,
  monthShortLabels,
  parseMonthKey,
  shiftMonthKey,
} from "@/domain/rules/monthPeriod";

const MONTH_LABELS = monthShortLabels();

type MonthFilterProps = {
  value: string | null;
  onChange: (value: string | null) => void;
  allowEmpty?: boolean;
  emptyLabel?: string;
  label?: string;
};

export function MonthFilter({
  value,
  onChange,
  allowEmpty = false,
  emptyLabel = "Todos os meses",
  label,
}: MonthFilterProps): JSX.Element {
  const current = currentMonthKey();
  const selected = parseMonthKey(value);
  const [anchor, setAnchor] = useState<HTMLElement | null>(null);
  const [pickerYear, setPickerYear] = useState(() => Number((selected ?? current).slice(0, 4)));
  const atCurrentMonth = selected === current;
  const currentYear = Number(current.slice(0, 4));

  const openPicker = (target: HTMLElement) => {
    setPickerYear(Number((selected ?? current).slice(0, 4)));
    setAnchor(target);
  };

  const selectMonth = (monthKey: string) => {
    if (isFutureMonth(monthKey)) return;
    onChange(monthKey);
    setAnchor(null);
  };

  const move = (delta: number) => {
    const origin = selected ?? current;
    const next = shiftMonthKey(origin, delta);
    if (isFutureMonth(next)) return;
    onChange(next);
  };

  return (
    <Box display="flex" flexDirection="column" gap={0.25}>
      {label && (
        <Typography variant="caption" color="text.secondary" sx={{ lineHeight: 1.2, px: 0.5 }}>
          {label}
        </Typography>
      )}
      <Box
        role="group"
        aria-label={label ? `Mês de ${label}` : "Mês"}
        sx={{
          display: "inline-flex",
          alignItems: "center",
          gap: 0.5,
          px: 0.5,
          py: 0.5,
          borderRadius: "12px",
          bgcolor: "#eef6e8",
        }}
      >
        <IconButton
          size="small"
          aria-label="Mês anterior"
          onClick={() => move(-1)}
          sx={arrowButtonSx}
        >
          <ChevronLeft fontSize="small" />
        </IconButton>
        <Box
          component="button"
          type="button"
          aria-label="Escolher mês"
          aria-haspopup="dialog"
          onClick={(event) => openPicker(event.currentTarget)}
          sx={{
            display: "inline-flex",
            alignItems: "center",
            gap: 0.75,
            border: 0,
            bgcolor: "transparent",
            cursor: "pointer",
            px: 1,
            py: 0.25,
            color: selected ? "#1f2937" : "#6b7280",
            font: "inherit",
            fontWeight: 700,
            fontSize: 15,
            lineHeight: 1.2,
          }}
        >
          {selected ? formatMonthKeyLabel(selected) : emptyLabel}
          <CalendarMonth sx={{ fontSize: 18, color: "#4b5563" }} />
        </Box>
        <IconButton
          size="small"
          aria-label="Próximo mês"
          disabled={!selected || atCurrentMonth}
          onClick={() => move(1)}
          sx={arrowButtonSx}
        >
          <ChevronRight fontSize="small" />
        </IconButton>
      </Box>
      <Popover
        open={Boolean(anchor)}
        anchorEl={anchor}
        onClose={() => setAnchor(null)}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
        transformOrigin={{ vertical: "top", horizontal: "center" }}
      >
        <Box sx={{ p: 1.5, width: 280 }}>
          <Box display="flex" alignItems="center" justifyContent="space-between" mb={1}>
            <IconButton
              size="small"
              aria-label="Ano anterior"
              onClick={() => setPickerYear((year) => year - 1)}
            >
              <ChevronLeft fontSize="small" />
            </IconButton>
            <Typography fontWeight={700}>{pickerYear}</Typography>
            <IconButton
              size="small"
              aria-label="Próximo ano"
              disabled={pickerYear >= currentYear}
              onClick={() => setPickerYear((year) => year + 1)}
            >
              <ChevronRight fontSize="small" />
            </IconButton>
          </Box>
          <Box display="grid" gridTemplateColumns="repeat(3, 1fr)" gap={0.75}>
            {MONTH_LABELS.map((monthLabel, index) => {
              const monthKey = `${pickerYear}-${String(index + 1).padStart(2, "0")}`;
              const disabled = isFutureMonth(monthKey);
              const active = monthKey === selected;
              return (
                <Box
                  key={monthKey}
                  component="button"
                  type="button"
                  disabled={disabled}
                  onClick={() => selectMonth(monthKey)}
                  sx={{
                    border: 0,
                    borderRadius: "8px",
                    py: 1,
                    cursor: disabled ? "default" : "pointer",
                    font: "inherit",
                    fontWeight: 600,
                    textTransform: "capitalize",
                    bgcolor: active ? "primary.main" : "transparent",
                    color: active ? "primary.contrastText" : disabled ? "text.disabled" : "text.primary",
                    "&:hover": {
                      bgcolor: active || disabled ? undefined : "action.hover",
                    },
                  }}
                >
                  {monthLabel}
                </Box>
              );
            })}
          </Box>
          {allowEmpty && selected && (
            <Box
              component="button"
              type="button"
              onClick={() => {
                onChange(null);
                setAnchor(null);
              }}
              sx={{
                mt: 1,
                width: "100%",
                border: 0,
                bgcolor: "transparent",
                cursor: "pointer",
                color: "text.secondary",
                font: "inherit",
                fontWeight: 600,
                py: 0.75,
              }}
            >
              Todos os meses
            </Box>
          )}
        </Box>
      </Popover>
    </Box>
  );
}

const arrowButtonSx = {
  width: 32,
  height: 32,
  bgcolor: "#fff",
  border: "1px solid #e5e7eb",
  borderRadius: "8px",
  color: "#4b5563",
  "&:hover": { bgcolor: "#fff" },
  "&.Mui-disabled": { bgcolor: "#fff", opacity: 0.4 },
};

import { FileDownload } from "@mui/icons-material";
import { Button } from "@mui/material";
import { useState } from "react";

interface ExportExcelButtonProps {
  onExport: () => Promise<void>;
  disabled?: boolean;
  label?: string;
}

export function ExportExcelButton({
  onExport,
  disabled = false,
  label = "Exportar Excel",
}: ExportExcelButtonProps): JSX.Element {
  const [exporting, setExporting] = useState(false);

  const handleClick = async () => {
    if (exporting || disabled) return;
    setExporting(true);
    try {
      await onExport();
    } finally {
      setExporting(false);
    }
  };

  return (
    <Button
      variant="outlined"
      startIcon={<FileDownload />}
      onClick={() => {
        void handleClick();
      }}
      disabled={disabled || exporting}
    >
      {exporting ? "Exportando..." : label}
    </Button>
  );
}

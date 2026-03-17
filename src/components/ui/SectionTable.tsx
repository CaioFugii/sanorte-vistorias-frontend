import { TableContainer } from "@mui/material";
import { DataCard } from "./DataCard";

interface SectionTableProps {
  title?: string;
  children: React.ReactNode;
}

export function SectionTable({ title, children }: SectionTableProps): JSX.Element {
  return (
    <DataCard title={title}>
      <TableContainer>{children}</TableContainer>
    </DataCard>
  );
}

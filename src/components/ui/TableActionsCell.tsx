import { Delete, Edit, Visibility } from "@mui/icons-material";
import { Box, Button, ButtonProps, TableCell, TableCellProps } from "@mui/material";

type TableActionsHeaderCellProps = Omit<TableCellProps, "children"> & {
  label?: string;
};

export function TableActionsHeaderCell({
  label = "Ações",
  align = "right",
  ...props
}: TableActionsHeaderCellProps): JSX.Element {
  return (
    <TableCell align={align} {...props}>
      {label}
    </TableCell>
  );
}

type TableActionsCellProps = TableCellProps;

export function TableActionsCell({
  align = "right",
  sx,
  children,
  ...props
}: TableActionsCellProps): JSX.Element {
  return (
    <TableCell
      align={align}
      sx={{ whiteSpace: "nowrap", ...sx }}
      {...props}
    >
      {children}
    </TableCell>
  );
}

type TableActionsGroupProps = {
  children: React.ReactNode;
};

export function TableActionsGroup({ children }: TableActionsGroupProps): JSX.Element {
  return (
    <Box display="flex" justifyContent="flex-end" gap={0.5} flexWrap="wrap">
      {children}
    </Box>
  );
}

type TableActionButtonProps = Omit<ButtonProps, "size" | "variant">;

function TableActionButton({ children, ...props }: TableActionButtonProps): JSX.Element {
  return (
    <Button size="small" variant="text" {...props}>
      {children}
    </Button>
  );
}

type TableViewButtonProps = Omit<TableActionButtonProps, "startIcon" | "children"> & {
  label?: string;
};

export function TableViewButton({ label = "Ver", ...props }: TableViewButtonProps): JSX.Element {
  return (
    <TableActionButton startIcon={<Visibility />} {...props}>
      {label}
    </TableActionButton>
  );
}

type TableEditButtonProps = Omit<TableActionButtonProps, "startIcon" | "children"> & {
  label?: string;
};

export function TableEditButton({ label = "Editar", ...props }: TableEditButtonProps): JSX.Element {
  return (
    <TableActionButton startIcon={<Edit />} {...props}>
      {label}
    </TableActionButton>
  );
}

type TableDeleteButtonProps = Omit<TableActionButtonProps, "startIcon" | "children" | "color"> & {
  label?: string;
};

export function TableDeleteButton({ label = "Excluir", ...props }: TableDeleteButtonProps): JSX.Element {
  return (
    <TableActionButton color="error" startIcon={<Delete />} {...props}>
      {label}
    </TableActionButton>
  );
}

import { TablePagination } from "@mui/material";
import { PaginationMeta } from "@/domain";

export interface ListPaginationProps {
  /** Metadados da página atual (page é 1-based). */
  meta: PaginationMeta;
  /** Callback quando a página muda (recebe nova página 1-based). */
  onPageChange: (page: number) => void;
  /** Callback opcional quando o número de linhas por página muda. Quem trata deve resetar para a página 1. */
  onRowsPerPageChange?: (limit: number) => void;
  /** Opções de itens por página. Se não informado, não exibe o seletor. */
  rowsPerPageOptions?: number[];
  /** Desabilita controles durante carregamento. */
  disabled?: boolean;
}

/**
 * Barra de paginação reutilizável para tabelas de listagem.
 * Usa page 1-based internamente; o MUI TablePagination usa 0-based.
 */
export function ListPagination({
  meta,
  onPageChange,
  onRowsPerPageChange,
  rowsPerPageOptions,
  disabled = false,
}: ListPaginationProps): JSX.Element {
  const hasRowsPerPageSelector =
    Array.isArray(rowsPerPageOptions) &&
    rowsPerPageOptions.length > 0 &&
    typeof onRowsPerPageChange === "function";

  return (
    <TablePagination
      component="div"
      count={meta.total}
      page={meta.page - 1}
      onPageChange={(_, newPage) => onPageChange(newPage + 1)}
      rowsPerPage={meta.limit}
      onRowsPerPageChange={
        hasRowsPerPageSelector
          ? (e) => {
              const limit = parseInt(e.target.value, 10);
              onRowsPerPageChange?.(limit);
            }
          : undefined
      }
      rowsPerPageOptions={
        hasRowsPerPageSelector ? rowsPerPageOptions : [meta.limit]
      }
      labelDisplayedRows={({ from, to, count }) =>
        `${from}–${to} de ${count !== -1 ? count : `mais de ${to}`}`
      }
      labelRowsPerPage="Linhas por página:"
      showFirstButton
      showLastButton
      disabled={disabled}
    />
  );
}

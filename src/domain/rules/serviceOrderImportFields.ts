const IMPORT_LINE_FIELDS: Array<{ keys: string[]; fallback?: string }> = [
  { keys: ["Número OS"] },
  { keys: ["Família", "Familia"] },
  { keys: ["Status da OS", "Status"] },
  { keys: ["Endereço", "Endereco"] },
  { keys: ["Número", "Numero"] },
  { keys: ["Bairro"] },
  { keys: ["Resultado"], fallback: "N/A" },
  { keys: ["Data Fim Execução"] },
  { keys: ["Tempo de execução efetivo"], fallback: "N/A" },
  { keys: ["Equipe"], fallback: "N/A" },
];

export interface ImportLineField {
  key: string;
  value: string;
}

function columnKey(rawRow: Record<string, string>, keys: string[]): string {
  return keys.find((key) => Object.prototype.hasOwnProperty.call(rawRow, key)) ?? keys[0];
}

export function visibleImportFields(rawRow: Record<string, string>): ImportLineField[] {
  return IMPORT_LINE_FIELDS.map((field) => {
    const present = field.keys.find((key) => Object.prototype.hasOwnProperty.call(rawRow, key));
    const key = present ?? field.keys[0];
    return {
      key,
      value: present ? (rawRow[key] ?? "") : (field.fallback ?? ""),
    };
  });
}

/**
 * Campos que a pessoa pode corrigir. `null` libera todos: o motivo não aponta uma célula.
 * OS repetida libera a chave (número, família e, em reposição, resultado).
 * Endereço vazio libera as três células que compõem o endereço.
 */
export function editableImportFieldKeys(
  reason: string | null | undefined,
  rawRow: Record<string, string>,
  sectorName?: string | null,
): Set<string> | null {
  const text = reason ?? "";
  const family = () => columnKey(rawRow, ["Família", "Familia"]);
  if (text.includes("Número da OS")) return new Set([columnKey(rawRow, ["Número OS"])]);
  if (
    text.includes("Família vazia") ||
    text.includes("Família VISTORIA") ||
    text.includes('Setor "')
  ) {
    return new Set([family()]);
  }
  if (text.includes("Status vazio")) return new Set([columnKey(rawRow, ["Status da OS", "Status"])]);
  if (text.includes("Endereço composto")) {
    return new Set([
      columnKey(rawRow, ["Endereço", "Endereco"]),
      columnKey(rawRow, ["Número", "Numero"]),
      columnKey(rawRow, ["Bairro"]),
    ]);
  }
  if (text.includes("OS repetida")) {
    const keys = new Set([columnKey(rawRow, ["Número OS"]), family()]);
    if ((sectorName ?? "").toUpperCase() === "REPOSICAO") {
      keys.add(columnKey(rawRow, ["Resultado"]));
    }
    return keys;
  }
  return null;
}

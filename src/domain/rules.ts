import {
  ChecklistAnswer,
  InspectionStatus,
} from './enums';
import {
  Inspection,
  InspectionItem,
  Evidence,
  Signature,
  ChecklistItem,
} from './types';

/**
 * Calcula o percentual de conformidade de uma vistoria
 * Percentual = (CONFORME / avaliados) * 100
 * NAO_APLICAVEL não conta como avaliado
 */
export function calcularPercentual(
  inspectionItems: InspectionItem[],
  checklistItems: ChecklistItem[]
): number {
  const itemsMap = new Map(
    checklistItems.map((item) => [item.id, item])
  );

  const avaliados = inspectionItems.filter(
    (item) =>
      item.answer !== null &&
      item.answer !== ChecklistAnswer.NAO_APLICAVEL &&
      itemsMap.has(item.checklistItemId)
  );

  if (avaliados.length === 0) return 0;

  const conformes = avaliados.filter(
    (item) => item.answer === ChecklistAnswer.CONFORME
  );

  return Math.round((conformes.length / avaliados.length) * 100);
}

/**
 * Determina o status ao finalizar uma vistoria
 * Se houver qualquer NAO_CONFORME => PENDENTE_AJUSTE
 * Caso contrário => FINALIZADA
 */
export function determinarStatusAoFinalizar(
  inspectionItems: InspectionItem[]
): InspectionStatus.FINALIZADA | InspectionStatus.PENDENTE_AJUSTE {
  const hasNonConformity = inspectionItems.some(
    (item) => item.answer === ChecklistAnswer.NAO_CONFORME
  );

  return hasNonConformity
    ? InspectionStatus.PENDENTE_AJUSTE
    : InspectionStatus.FINALIZADA;
}

/**
 * Valida se uma vistoria pode ser finalizada
 * Retorna objeto com isValid e errors
 */
export function validarFinalizacao(
  _inspection: Inspection,
  inspectionItems: InspectionItem[],
  evidences: Evidence[],
  signature: Signature | null,
  checklistItems: ChecklistItem[]
): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];

  // Assinatura obrigatória
  if (!signature) {
    errors.push('Assinatura do líder/encarregado é obrigatória');
  }

  // Verificar se todos os itens foram avaliados (exceto NAO_APLICAVEL)
  const itemsMap = new Map(
    checklistItems.map((item) => [item.id, item])
  );

  const itemsToEvaluate = inspectionItems.filter((item) =>
    itemsMap.has(item.checklistItemId)
  );

  const notEvaluated = itemsToEvaluate.filter(
    (item) => item.answer === null
  );

  if (notEvaluated.length > 0) {
    errors.push(
      `Existem ${notEvaluated.length} item(ns) sem avaliação`
    );
  }

  // Verificar fotos obrigatórias para NAO_CONFORME
  const nonConformities = inspectionItems.filter(
    (item) => item.answer === ChecklistAnswer.NAO_CONFORME
  );

  for (const item of nonConformities) {
    const checklistItem = itemsMap.get(item.checklistItemId);
    if (
      checklistItem?.requiresPhotoOnNonConformity &&
      !evidences.some((e) => e.inspectionItemId === item.id)
    ) {
      errors.push(
        `Item "${checklistItem.title}" requer foto obrigatória por estar não conforme`
      );
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

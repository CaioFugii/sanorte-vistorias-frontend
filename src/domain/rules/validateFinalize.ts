import { ChecklistAnswer, ModuleType } from "../enums";
import { Checklist, Evidence, InspectionItem, Signature } from "../types";

interface ValidateFinalizeInput {
  checklist: Checklist;
  inspectionItems: InspectionItem[];
  evidences: Evidence[];
  signature: Signature | null;
}

export function validateFinalize({
  checklist,
  inspectionItems,
  evidences,
  signature,
}: ValidateFinalizeInput): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];
  const isRemotoModule = checklist.module === ModuleType.REMOTO;
  const isWorkSafetyModule = checklist.module === ModuleType.SEGURANCA_TRABALHO;
  const isPostWorkModule = checklist.module === ModuleType.POS_OBRA;
  const signatureRequired = !isRemotoModule && !isWorkSafetyModule && !isPostWorkModule;

  if (signatureRequired && (!signature || !signature.signerName.trim())) {
    errors.push("Assinatura do líder/encarregado é obrigatória.");
  }

  const checklistItems = checklist.sections
    .flatMap((section) => section.items)
    .filter((item) => item.active);
  const itemMap = new Map(checklistItems.map((item) => [item.id, item]));

  const missingAnswers = checklistItems.filter((item) => {
    const answer = inspectionItems.find((i) => i.checklistItemId === item.id)?.answer;
    return !answer;
  });
  if (missingAnswers.length > 0) {
    errors.push("Existem itens sem resposta.");
  }

  if (!isRemotoModule) {
    const nonConformityItems = inspectionItems.filter(
      (item) => item.answer === ChecklistAnswer.NAO_CONFORME
    );
    for (const item of nonConformityItems) {
      const checklistItem = itemMap.get(item.checklistItemId);
      if (!checklistItem?.requiresPhotoOnNonConformity) {
        continue;
      }
      const hasEvidence = evidences.some((evidence) => evidence.inspectionItemId === item.id);
      if (!hasEvidence) {
        errors.push(`O item "${checklistItem.title}" requer foto obrigatória.`);
      }
    }
  }

  return { isValid: errors.length === 0, errors };
}

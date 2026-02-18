import { ChecklistAnswer } from "../enums";
import { InspectionItem } from "../types";

export function calculateScore(items: InspectionItem[]): number {
  const evaluated = items.filter(
    (item) => item.answer && item.answer !== ChecklistAnswer.NAO_APLICAVEL
  );
  if (evaluated.length === 0) {
    return 100;
  }
  const conformes = evaluated.filter(
    (item) => item.answer === ChecklistAnswer.CONFORME
  ).length;
  return Math.round((conformes / evaluated.length) * 100);
}

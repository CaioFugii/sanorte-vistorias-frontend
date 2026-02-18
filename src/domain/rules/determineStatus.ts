import { ChecklistAnswer, InspectionStatus } from "../enums";
import { InspectionItem } from "../types";

export function determineStatus(
  items: InspectionItem[]
): InspectionStatus.FINALIZADA | InspectionStatus.PENDENTE_AJUSTE {
  return items.some((item) => item.answer === ChecklistAnswer.NAO_CONFORME)
    ? InspectionStatus.PENDENTE_AJUSTE
    : InspectionStatus.FINALIZADA;
}

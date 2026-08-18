/** Máximo de perguntas (`ChecklistItem`) por checklist. */
export const MAX_CHECKLIST_ITEMS = 50;

export function canAddChecklistItem(currentCount: number): boolean {
  return currentCount < MAX_CHECKLIST_ITEMS;
}

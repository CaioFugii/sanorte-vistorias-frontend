import { ModuleType } from "@/domain/enums";
import { InspectionsPage } from "./InspectionsPage";

const QUALITY_MODULE_OPTIONS = [
  ModuleType.CAMPO,
  ModuleType.REMOTO,
  ModuleType.POS_OBRA,
  ModuleType.OBRAS_INVESTIMENTO,
];

export function QualityInspectionsPage(): JSX.Element {
  return <InspectionsPage moduleOptions={QUALITY_MODULE_OPTIONS} />;
}

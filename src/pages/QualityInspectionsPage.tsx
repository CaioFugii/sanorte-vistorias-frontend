import { ModuleType } from "@/domain/enums";
import { InspectionsPage } from "./InspectionsPage";

export function QualityInspectionsPage(): JSX.Element {
  return (
    <InspectionsPage
      moduleOptions={[
        ModuleType.CAMPO,
        ModuleType.REMOTO,
        ModuleType.POS_OBRA,
        ModuleType.OBRAS_INVESTIMENTO,
      ]}
    />
  );
}

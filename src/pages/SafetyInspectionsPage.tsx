import { ModuleType } from "@/domain/enums";
import { InspectionsPage } from "./InspectionsPage";

export function SafetyInspectionsPage(): JSX.Element {
  return (
    <InspectionsPage
      moduleOptions={[ModuleType.SEGURANCA_TRABALHO]}
      defaultModule={ModuleType.SEGURANCA_TRABALHO}
    />
  );
}

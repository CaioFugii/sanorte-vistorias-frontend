import { ModuleType } from "@/domain/enums";
import { InspectionsPage } from "./InspectionsPage";

const SAFETY_MODULE_OPTIONS = [ModuleType.SEGURANCA_TRABALHO];

export function SafetyInspectionsPage(): JSX.Element {
  return (
    <InspectionsPage
      moduleOptions={SAFETY_MODULE_OPTIONS}
      defaultModule={ModuleType.SEGURANCA_TRABALHO}
    />
  );
}
